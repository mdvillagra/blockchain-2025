// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LendingProtocol is ReentrancyGuard {
    // Referencias a los tokens (direcciones se pasan en constructor)
    IERC20 public immutable collateralToken; // CollateralToken (cUSD)
    IERC20 public immutable loanToken;       // LoanToken (dDAI)
    
    // Constantes del protocolo
    uint256 public constant COLLATERAL_RATIO = 150; // 150%
    uint256 public constant INTEREST_RATE = 5;      // 5% fijo
    uint256 public constant PRECISION = 100;
    
    // Estructura de datos del usuario
    struct UserData {
        uint256 collateralBalance;  // Balance de CollateralToken depositado
        uint256 loanAmount;         // Cantidad de LoanToken prestado
        uint256 accruedInterest;
        uint256 lastUpdateTime;
    }
    
    // Mapeo de usuarios
    mapping(address => UserData) public userData;
    
    // Eventos
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    
    /**
     * @dev Constructor recibe las direcciones de los tokens ya desplegados
     * @param _collateralToken Dirección del CollateralToken (cUSD)
     * @param _loanToken Dirección del LoanToken (dDAI)
     */
    constructor(address _collateralToken, address _loanToken) {
        require(_collateralToken != address(0), "Invalid collateral token address");
        require(_loanToken != address(0), "Invalid loan token address");
        
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }
    
    /**
     * @dev Usuario deposita CollateralToken (cUSD) como colateral
     * @param amount Cantidad de CollateralToken a depositar
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transferir CollateralToken del usuario al contrato
        collateralToken.transferFrom(msg.sender, address(this), amount);
        
        // Actualizar balance del usuario
        userData[msg.sender].collateralBalance += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Usuario solicita préstamo en LoanToken (dDAI)
     * Máximo: 66.67% del valor del colateral (ratio 150%)
     * @param amount Cantidad de LoanToken a pedir prestado
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = userData[msg.sender];
        
        // Calcular máximo préstamo permitido (66.67% del colateral)
        uint256 maxLoan = (user.collateralBalance * PRECISION) / COLLATERAL_RATIO;
        uint256 totalDebt = user.loanAmount + amount;
        
        require(totalDebt <= maxLoan, "Exceeds maximum loan amount");
        require(loanToken.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        // Actualizar datos del usuario
        user.loanAmount += amount;
        user.lastUpdateTime = block.timestamp;
        
        // Transferir LoanToken al usuario
        loanToken.transfer(msg.sender, amount);
        
        emit LoanBorrowed(msg.sender, amount);
    }
    
    /**
     * @dev Usuario paga el préstamo en LoanToken con interés fijo del 5%
     */
    function repay() external nonReentrant {
        UserData storage user = userData[msg.sender];
        require(user.loanAmount > 0, "No active loan");
        
        // Calcular interés acumulado (5% fijo, sin composición)
        uint256 interest = (user.loanAmount * INTEREST_RATE) / 100;
        uint256 totalRepayment = user.loanAmount + interest;
        
        // Usuario transfiere LoanToken de vuelta al contrato
        loanToken.transferFrom(msg.sender, address(this), totalRepayment);
        
        // Limpiar deuda del usuario
        uint256 repaidAmount = user.loanAmount;
        user.loanAmount = 0;
        user.accruedInterest = 0;
        user.lastUpdateTime = 0;
        
        emit LoanRepaid(msg.sender, repaidAmount, interest);
    }
    
    /**
     * @dev Usuario retira CollateralToken si no hay deuda activa
     */
    function withdrawCollateral() external nonReentrant {
        UserData storage user = userData[msg.sender];
        require(user.loanAmount == 0, "Must repay loan first");
        require(user.collateralBalance > 0, "No collateral to withdraw");
        
        uint256 amount = user.collateralBalance;
        user.collateralBalance = 0;
        
        // Transferir CollateralToken de vuelta al usuario
        collateralToken.transfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Vista: Devuelve datos del usuario
     * @param user Dirección del usuario
     * @return collateralBalance Balance de CollateralToken
     * @return currentDebt Deuda actual en LoanToken
     * @return accruedInterest Interés acumulado
     */
    function getUserData(address user) external view returns (
        uint256 collateralBalance,
        uint256 currentDebt,
        uint256 accruedInterest
    ) {
        UserData memory userInfo = userData[user];
        
        collateralBalance = userInfo.collateralBalance;
        currentDebt = userInfo.loanAmount;
        
        // Calcular interés (5% fijo)
        if (userInfo.loanAmount > 0) {
            accruedInterest = (userInfo.loanAmount * INTEREST_RATE) / 100;
        } else {
            accruedInterest = 0;
        }
    }
    
    /**
     * @dev Vista: Calcula máximo monto que se puede pedir prestado
     * @param user Dirección del usuario
     * @return Máximo monto disponible para préstamo en LoanToken
     */
    function getMaxBorrowAmount(address user) external view returns (uint256) {
        UserData memory userInfo = userData[user];
        uint256 maxTotal = (userInfo.collateralBalance * PRECISION) / COLLATERAL_RATIO;
        
        if (maxTotal > userInfo.loanAmount) {
            return maxTotal - userInfo.loanAmount;
        }
        return 0;
    }
    
    /**
     * @dev Vista: Obtiene direcciones de los tokens
     * @return collateral Dirección del CollateralToken
     * @return loan Dirección del LoanToken
     */
    function getTokenAddresses() external view returns (address collateral, address loan) {
        collateral = address(collateralToken);
        loan = address(loanToken);
    }
}