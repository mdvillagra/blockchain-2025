// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingProtocol is Ownable {
    IERC20 public immutable collateralToken; // cUSD
    IERC20 public immutable loanToken;       // dDAI
    
    // Constantes del protocolo
    uint256 public constant COLLATERAL_RATIO = 150; // 150% - necesitas 150 cUSD para pedir 100 dDAI
    uint256 public constant WEEKLY_INTEREST_RATE = 5; // 5% por semana, interés fijo
    
    struct UserPosition {
        uint256 collateral;        // Cantidad de cUSD depositada
        uint256 debt;             // Cantidad de dDAI prestada
        uint256 weeksPassed;      // Número de semanas transcurridas (simuladas por repagos)
        uint256 totalInterest;    // Interés total acumulado
    }
    
    mapping(address => UserPosition) public positions;
    
    // Eventos
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    
    constructor(address _collateralToken, address _loanToken) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }
    
    /**
     * @notice Depositar tokens cUSD como colateral
     * @param amount Cantidad de cUSD a depositar
     */
    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transferir cUSD del usuario al contrato
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        positions[msg.sender].collateral += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @notice Solicitar préstamo en dDAI
     * @param amount Cantidad de dDAI a pedir prestada
     */
    function borrow(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        UserPosition storage position = positions[msg.sender];
        
        // Verificar que tiene suficiente colateral (150% del préstamo)
        uint256 maxBorrow = position.collateral * 100 / COLLATERAL_RATIO;
        require(
            position.debt + amount <= maxBorrow,
            "Insufficient collateral - need 150% ratio"
        );
        
        // Verificar que el contrato tiene suficientes dDAI
        require(
            loanToken.balanceOf(address(this)) >= amount,
            "Insufficient dDAI in contract"
        );
        
        position.debt += amount;
        
        // Transferir dDAI al usuario
        require(loanToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit LoanBorrowed(msg.sender, amount);
    }
    
    /**
     * @notice Repagar deuda (simula una semana pasada)
     * Cada llamada a repay simula que pasó una semana y agrega 5% de interés
     */
    function repay() external {
        UserPosition storage position = positions[msg.sender];
        require(position.debt > 0, "No debt to repay");
        
        // Simular que pasó una semana
        position.weeksPassed += 1;
        
        // Calcular interés de esta semana (5% de la deuda actual)
        uint256 weeklyInterest = (position.debt * WEEKLY_INTEREST_RATE) / 100;
        position.totalInterest += weeklyInterest;
        
        // Total a repagar: deuda + interés acumulado
        uint256 totalToRepay = position.debt + position.totalInterest;
        
        // Verificar que el usuario tiene suficientes dDAI
        require(
            loanToken.balanceOf(msg.sender) >= totalToRepay,
            "Insufficient dDAI to repay"
        );
        
        // Transferir dDAI del usuario al contrato
        require(
            loanToken.transferFrom(msg.sender, address(this), totalToRepay),
            "Transfer failed"
        );
        
        emit LoanRepaid(msg.sender, position.debt, position.totalInterest);
        
        // Resetear la posición
        position.debt = 0;
        position.totalInterest = 0;
        position.weeksPassed = 0;
    }
    
    /**
     * @notice Retirar colateral (solo si no hay deuda)
     */
    function withdrawCollateral() external {
        UserPosition storage position = positions[msg.sender];
        require(position.debt == 0, "Cannot withdraw with pending debt");
        require(position.collateral > 0, "No collateral to withdraw");
        
        uint256 amount = position.collateral;
        position.collateral = 0;
        
        // Transferir cUSD al usuario
        require(collateralToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Obtener datos del usuario
     * @param user Dirección del usuario
     * @return collateral Colateral depositado
     * @return debt Deuda actual
     * @return totalInterest Interés total acumulado
     * @return weeksPassed Semanas transcurridas
     * @return maxBorrowAmount Máximo que puede pedir prestado
     */
    function getUserData(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 totalInterest,
        uint256 weeksPassed,
        uint256 maxBorrowAmount
    ) {
        UserPosition memory position = positions[user];
        
        collateral = position.collateral;
        debt = position.debt;
        totalInterest = position.totalInterest;
        weeksPassed = position.weeksPassed;
        maxBorrowAmount = (position.collateral * 100) / COLLATERAL_RATIO;
    }
    
    /**
     * @notice Función para que el owner pueda depositar dDAI al contrato
     * @param amount Cantidad de dDAI a depositar
     */
    function fundContract(uint256 amount) external onlyOwner {
        require(
            loanToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }
    
    /**
     * @notice Ver balance de dDAI del contrato
     */
    function getContractBalance() external view returns (uint256) {
        return loanToken.balanceOf(address(this));
    }
}