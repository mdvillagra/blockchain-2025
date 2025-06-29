// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingProtocol
 * @dev Protocolo de préstamos descentralizado con colateral
 * Permite depositar cUSD como colateral y pedir prestado dDAI
 * Ratio de colateralización: 150% (66% LTV exacto)
 * Interés fijo: 5% aplicado inmediatamente al pedir prestado
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    IERC20 public immutable collateralToken; // cUSD
    IERC20 public immutable loanToken; // dDAI
    
    // Constantes del protocolo
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150%
    uint256 public constant INTEREST_RATE = 5; // 5% por periodo
    uint256 public constant PRECISION = 100;
    
    // Estructura para almacenar datos del usuario
    struct UserData {
        uint256 collateralBalance;     // Cantidad de colateral depositado
        uint256 loanBalance;          // Cantidad prestada
        uint256 interestAccrued;      // Interés acumulado
        uint256 lastInterestUpdate;   // Timestamp de última actualización de interés
    }
    
    // Mapping de usuarios a sus datos
    mapping(address => UserData) public userData;
    
    // Eventos
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    
    constructor(
        address _collateralToken,
        address _loanToken
    ) Ownable(msg.sender) {
        require(_collateralToken != address(0), "Invalid collateral token");
        require(_loanToken != address(0), "Invalid loan token");
        
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }
    
    /**
     * @dev Depositar tokens como colateral
     * @param amount Cantidad de tokens a depositar
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = userData[msg.sender];
        
        // Actualizar interés antes de modificar el colateral
        _updateInterest(msg.sender);
        
        // Transferir tokens del usuario al contrato
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Actualizar balance de colateral
        user.collateralBalance += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Pedir prestado tokens
     * @param amount Cantidad de tokens a pedir prestado
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = userData[msg.sender];
        
        // Actualizar interés antes de prestar
        _updateInterest(msg.sender);
        
        // Calcular nueva deuda total
        uint256 newLoanBalance = user.loanBalance + amount;
        
        // Verificar que el préstamo principal no exceda el 66% del colateral
        uint256 maxLoanAmount = (user.collateralBalance * 66) / 100; // 66% exacto
        require(newLoanBalance <= maxLoanAmount, "Insufficient collateral");
        
        // Aplicar interés fijo inmediatamente al nuevo préstamo
        uint256 newInterest = (amount * INTEREST_RATE) / PRECISION;
        uint256 newInterestAccrued = user.interestAccrued + newInterest;
        
        // Verificar que el contrato tenga suficientes tokens para prestar
        require(
            loanToken.balanceOf(address(this)) >= amount,
            "Insufficient liquidity"
        );
        
        // Actualizar balances
        user.loanBalance = newLoanBalance;
        user.interestAccrued = newInterestAccrued;
        
        // Actualizar timestamp después de establecer el préstamo
        _updateInterest(msg.sender);
        
        // Transferir tokens al usuario
        require(loanToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit LoanTaken(msg.sender, amount);
    }
    
    /**
     * @dev Pagar préstamo con interés
     */
    function repay() external nonReentrant {
        UserData storage user = userData[msg.sender];
        require(user.loanBalance > 0, "No active loan");
        
        // Actualizar interés
        _updateInterest(msg.sender);
        
        uint256 totalDebt = user.loanBalance + user.interestAccrued;
        require(totalDebt > 0, "No debt to repay");
        
        // Transferir tokens del usuario al contrato
        require(
            loanToken.transferFrom(msg.sender, address(this), totalDebt),
            "Transfer failed"
        );
        
        // Resetear balances
        uint256 repaidAmount = user.loanBalance;
        uint256 interestPaid = user.interestAccrued;
        
        user.loanBalance = 0;
        user.interestAccrued = 0;
        user.lastInterestUpdate = block.timestamp;
        
        emit LoanRepaid(msg.sender, repaidAmount, interestPaid);
    }
    
    /**
     * @dev Retirar colateral (solo si no hay deuda)
     */
    function withdrawCollateral() external nonReentrant {
        UserData storage user = userData[msg.sender];
        require(user.collateralBalance > 0, "No collateral to withdraw");
        
        // Actualizar interés
        _updateInterest(msg.sender);
        
        // Verificar que no hay deuda pendiente
        require(user.loanBalance == 0, "Active loan exists");
        require(user.interestAccrued == 0, "Unpaid interest exists");
        
        uint256 collateralAmount = user.collateralBalance;
        user.collateralBalance = 0;
        
        // Transferir colateral de vuelta al usuario
        require(
            collateralToken.transfer(msg.sender, collateralAmount),
            "Transfer failed"
        );
        
        emit CollateralWithdrawn(msg.sender, collateralAmount);
    }
    
    /**
     * @dev Obtener datos del usuario
     * @param user Dirección del usuario
     * @return collateralBalance Balance de colateral
     * @return loanBalance Balance de préstamo
     * @return interestAccrued Interés acumulado
     */
    function getUserData(address user) external view returns (
        uint256 collateralBalance,
        uint256 loanBalance,
        uint256 interestAccrued
    ) {
        UserData memory data = userData[user];
        
        // Devolver el interés ya acumulado sin duplicar el cálculo
        // El interés se actualiza correctamente en _updateInterest() cuando se hacen operaciones
        return (
            data.collateralBalance,
            data.loanBalance,
            data.interestAccrued
        );
    }
    
    /**
     * @dev Función interna para actualizar el interés acumulado
     * @param user Dirección del usuario
     */
    function _updateInterest(address user) internal {
        UserData storage data = userData[user];
        
        // Solo actualizar timestamp si hay préstamo activo
        // El interés se aplica directamente en borrow()
        if (data.loanBalance > 0 && data.lastInterestUpdate == 0) {
            data.lastInterestUpdate = block.timestamp;
        }
    }
    
    /**
     * @dev Función para que el owner deposite liquidez inicial
     * @param amount Cantidad de tokens de préstamo a depositar
     */
    function depositLiquidity(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            loanToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }
    
    /**
     * @dev Función para que el owner retire liquidez
     * @param amount Cantidad de tokens de préstamo a retirar
     */
    function withdrawLiquidity(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            loanToken.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        require(loanToken.transfer(msg.sender, amount), "Transfer failed");
    }
} 