// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LendingProtocol is Ownable, ReentrancyGuard {
    IERC20 public collateralToken;
    IERC20 public loanToken;
    
    uint256 public constant COLLATERAL_RATIO = 150; // 150%
    uint256 public constant INTEREST_RATE = 5; // 5% weekly
    uint256 public constant BASIS_POINTS = 10000;
    
    struct UserData {
        uint256 collateral;
        uint256 debt;
        uint256 lastInterestTimestamp;
    }
    
    mapping(address => UserData) public userData;
    
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    
    constructor(address _collateralToken, address _loanToken) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }
    
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        collateralToken.transferFrom(msg.sender, address(this), amount);
        
        UserData storage data = userData[msg.sender];
        data.collateral += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage data = userData[msg.sender];
        require(data.collateral > 0, "No collateral deposited");
        
        // Calculate maximum borrow amount based on 150% collateral ratio
        // If collateral is 150, max borrow is 100 (150/1.5)
        uint256 maxBorrow = (data.collateral * 100) / COLLATERAL_RATIO;
        require(amount <= maxBorrow, "Borrow amount exceeds limit");
        
        // Mint loan tokens
        require(IERC20(address(loanToken)).transfer(msg.sender, amount), "Transfer failed");
        
        data.debt += amount;
        data.lastInterestTimestamp = block.timestamp;
        
        emit LoanBorrowed(msg.sender, amount);
    }
    
    function repay() external nonReentrant {
        UserData storage data = userData[msg.sender];
        require(data.debt > 0, "No debt to repay");
        
        uint256 interest = calculateInterest(msg.sender);
        uint256 totalRepayment = data.debt + interest;
        
        // Verificar el balance del usuario
        uint256 userBalance = loanToken.balanceOf(msg.sender);
        require(userBalance >= totalRepayment, "Insufficient balance");
        
        // Verificar la aprobación
        uint256 allowance = loanToken.allowance(msg.sender, address(this));
        require(allowance >= totalRepayment, "Insufficient allowance");
        
        // Intentar la transferencia
        bool success = loanToken.transferFrom(msg.sender, address(this), totalRepayment);
        require(success, "Transfer failed");
        
        data.debt = 0;
        data.lastInterestTimestamp = block.timestamp;
        
        emit LoanRepaid(msg.sender, totalRepayment);
    }
    
    function withdrawCollateral() external nonReentrant {
        UserData storage data = userData[msg.sender];
        require(data.debt == 0, "Debt must be repaid first");
        require(data.collateral > 0, "No collateral to withdraw");
        
        uint256 amount = data.collateral;
        data.collateral = 0;
        
        require(collateralToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    function calculateInterest(address user) public view returns (uint256) {
        UserData storage data = userData[user];
        if (data.debt == 0) return 0;
        
        // Simple interest calculation (5% weekly)
        return (data.debt * INTEREST_RATE) / 100;
    }
    
    function getUserData(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 interest
    ) {
        UserData storage data = userData[user];
        return (
            data.collateral,
            data.debt,
            calculateInterest(user)
        );
    }
} 