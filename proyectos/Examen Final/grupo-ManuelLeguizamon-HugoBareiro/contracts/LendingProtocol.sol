// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LendingProtocol is ReentrancyGuard {
    IERC20 public immutable collateralToken; // El token de colateral (cUSD) 
    IERC20 public immutable loanToken;       // El token de prestamo (dDAI) 

    uint256 public constant COLLATERALIZATION_RATIO = 150; // Ratio de colateralización del 150% 
    uint256 public constant INTEREST_RATE = 5; // Interés fijo del 5% 
    uint256 public constant INTEREST_PERIOD_WEEKS = 1; // Interés calculado por semana 

    struct UserData {
        uint256 collateralAmount;
        uint256 debtAmount;
        uint256 loanTimestamp;
    }

    mapping(address => UserData) public users;

    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 totalPaid);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    constructor(address _collateralToken, address _loanToken) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }
    
    // El usuario deposita tokens colaterales 
    function depositCollateral(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Deposit amount must be greater than 0");
        users[msg.sender].collateralAmount += _amount;
        
        // Transfiere los tokens desde el usuario hacia este contrato
        bool sent = collateralToken.transferFrom(msg.sender, address(this), _amount);
        require(sent, "Token transfer failed");

        emit CollateralDeposited(msg.sender, _amount);
    }
    
    // Permite pedir prestado hasta el 66% del valor del colateral 
    function borrow(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Borrow amount must be greater than 0");
        UserData storage user = users[msg.sender];
        require(user.collateralAmount > 0, "No collateral deposited");

        uint256 maxBorrowable = (user.collateralAmount * 100) / COLLATERALIZATION_RATIO;
        uint256 totalDebt = user.debtAmount + calculateInterest(msg.sender);
        require(_amount <= (maxBorrowable - totalDebt), "Borrow amount exceeds collateral limit");

        user.debtAmount += _amount;
        if(user.loanTimestamp == 0) {
            user.loanTimestamp = block.timestamp;
        }

        // Transfiere los tokens de préstamo al usuario
        bool sent = loanToken.transfer(msg.sender, _amount);
        require(sent, "Loan token transfer failed");

        emit LoanBorrowed(msg.sender, _amount);
    }

    // El usuario paga el préstamo con interés 
    function repay() external nonReentrant {
        UserData storage user = users[msg.sender];
        uint256 interest = calculateInterest(msg.sender);
        uint256 totalDebt = user.debtAmount + interest;

        require(totalDebt > 0, "No debt to repay");

        user.debtAmount = 0;
        user.loanTimestamp = 0;

        // El usuario transfiere el total de la deuda de vuelta al contrato
        bool sent = loanToken.transferFrom(msg.sender, address(this), totalDebt);
        require(sent, "Repayment transfer failed");

        emit LoanRepaid(msg.sender, totalDebt);
    }

    // Retira colateral si no hay deuda activa 
    function withdrawCollateral() external nonReentrant {
        UserData storage user = users[msg.sender];
        uint256 interest = calculateInterest(msg.sender);
        require(user.debtAmount + interest == 0, "Cannot withdraw with an active loan");
        
        uint256 amountToWithdraw = user.collateralAmount;
        require(amountToWithdraw > 0, "No collateral to withdraw");
        
        user.collateralAmount = 0;
        
        // Devuelve el colateral al usuario
        bool sent = collateralToken.transfer(msg.sender, amountToWithdraw);
        require(sent, "Collateral transfer failed");

        emit CollateralWithdrawn(msg.sender, amountToWithdraw);
    }
    
    // Devuelve los datos del usuario 
    function getUserData(address _user) external view returns (uint256, uint256, uint256) {
        UserData storage user = users[_user];
        uint256 interest = calculateInterest(_user);
        return (user.collateralAmount, user.debtAmount, interest);
    }

    function calculateInterest(address _user) public view returns (uint256) {
        UserData storage user = users[_user];
        if (user.debtAmount == 0 || user.loanTimestamp == 0) {
            return 0;
        }
        
        // Simulación de interés semanal no compuesto 
        uint256 timeElapsed = block.timestamp - user.loanTimestamp;
        uint256 weeksElapsed = timeElapsed / (7 days);

        if (weeksElapsed == 0) {
            return 0;
        }

        return (user.debtAmount * INTEREST_RATE * weeksElapsed) / 100;
    }
}