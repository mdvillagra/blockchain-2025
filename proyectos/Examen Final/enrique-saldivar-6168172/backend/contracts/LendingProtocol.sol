// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingProtocol
 * @dev Protocolo de préstamos descentralizados con colateral
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    // Tokens del protocolo
    IERC20 public immutable collateralToken; // cUSD
    IERC20 public immutable loanToken; // dDAI
    
    // Constantes del protocolo
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150%
    uint256 public constant INTEREST_RATE = 5; // 5% de interés
    uint256 public constant PRECISION = 100;
    
    // Estructura de datos del usuario
    struct UserData {
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 interestAccrued;
        uint256 lastInterestUpdate;
    }
    
    // Mapeo de usuarios a sus datos
    mapping(address => UserData) public users;
    
    // Eventos
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    
    /**
     * @dev Constructor del contrato
     * @param _collateralToken Dirección del token de colateral
     * @param _loanToken Dirección del token de préstamo
     */
    constructor(address _collateralToken, address _loanToken) Ownable(msg.sender) {
        require(_collateralToken != address(0), "Invalid collateral token");
        require(_loanToken != address(0), "Invalid loan token");
        
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }
    
    /**
     * @dev Depositar colateral
     * @param amount Cantidad de tokens de colateral a depositar
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = users[msg.sender];
        
        // Actualizar interés antes de cambiar el colateral
        if (user.loanAmount > 0) {
            _updateInterest(msg.sender);
        }
        
        // Transferir tokens del usuario al contrato
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Collateral transfer failed"
        );
        
        user.collateralAmount += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Solicitar préstamo
     * @param amount Cantidad de tokens a pedir prestado
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = users[msg.sender];
        require(user.collateralAmount > 0, "No collateral deposited");
        
        // Actualizar interés antes de tomar más préstamo
        if (user.loanAmount > 0) {
            _updateInterest(msg.sender);
        }
        
        uint256 maxBorrowAmount = (user.collateralAmount * PRECISION) / COLLATERALIZATION_RATIO;
        uint256 totalDebt = user.loanAmount + user.interestAccrued + amount;
        
        require(totalDebt <= maxBorrowAmount, "Insufficient collateral");
        require(loanToken.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        user.loanAmount += amount;
        user.lastInterestUpdate = block.timestamp;
        
        // Transferir tokens al usuario
        require(loanToken.transfer(msg.sender, amount), "Loan transfer failed");
        
        emit LoanTaken(msg.sender, amount);
    }
    
    /**
     * @dev Repagar préstamo
     */
    function repay() external nonReentrant {
        UserData storage user = users[msg.sender];
        require(user.loanAmount > 0, "No active loan");
        
        // Actualizar interés
        _updateInterest(msg.sender);
        
        uint256 totalDebt = user.loanAmount + user.interestAccrued;
        require(totalDebt > 0, "No debt to repay");
        
        // Transferir tokens del usuario al contrato
        require(
            loanToken.transferFrom(msg.sender, address(this), totalDebt),
            "Repayment transfer failed"
        );
        
        emit LoanRepaid(msg.sender, user.loanAmount, user.interestAccrued);
        
        // Resetear deuda
        user.loanAmount = 0;
        user.interestAccrued = 0;
        user.lastInterestUpdate = 0;
    }
    
    /**
     * @dev Retirar colateral
     */
    function withdrawCollateral() external nonReentrant {
        UserData storage user = users[msg.sender];
        require(user.collateralAmount > 0, "No collateral to withdraw");
        require(user.loanAmount == 0 && user.interestAccrued == 0, "Outstanding debt exists");
        
        uint256 collateralToWithdraw = user.collateralAmount;
        user.collateralAmount = 0;
        
        // Transferir colateral de vuelta al usuario
        require(
            collateralToken.transfer(msg.sender, collateralToWithdraw),
            "Collateral transfer failed"
        );
        
        emit CollateralWithdrawn(msg.sender, collateralToWithdraw);
    }
    
    /**
     * @dev Obtener datos del usuario
     * @param user Dirección del usuario
     * @return collateral Cantidad de colateral
     * @return loan Cantidad de préstamo
     * @return interest Interés acumulado
     */
    function getUserData(address user) external view returns (uint256 collateral, uint256 loan, uint256 interest) {
        UserData memory userData = users[user];
        
        collateral = userData.collateralAmount;
        loan = userData.loanAmount;
        interest = userData.interestAccrued;
        
        // Calcular interés actualizado si hay préstamo activo
        if (userData.loanAmount > 0 && userData.lastInterestUpdate > 0) {
            uint256 timeElapsed = block.timestamp - userData.lastInterestUpdate;
            uint256 weeksPassed = timeElapsed / 1 weeks;
            
            if (weeksPassed > 0) {
                uint256 newInterest = (userData.loanAmount * INTEREST_RATE * weeksPassed) / PRECISION;
                interest += newInterest;
            }
        }
    }
    
    /**
     * @dev Actualizar interés acumulado (función interna)
     * @param user Dirección del usuario
     */
    function _updateInterest(address user) internal {
        UserData storage userData = users[user];
        
        if (userData.loanAmount > 0 && userData.lastInterestUpdate > 0) {
            uint256 timeElapsed = block.timestamp - userData.lastInterestUpdate;
            uint256 weeksPassed = timeElapsed / 1 weeks;
            
            if (weeksPassed > 0) {
                uint256 newInterest = (userData.loanAmount * INTEREST_RATE * weeksPassed) / PRECISION;
                userData.interestAccrued += newInterest;
                userData.lastInterestUpdate = block.timestamp;
            }
        }
    }
    
    /**
     * @dev Función para que el owner retire tokens del protocolo (para distribución inicial)
     * @param token Dirección del token
     * @param amount Cantidad a retirar
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "Token transfer failed");
    }
}
