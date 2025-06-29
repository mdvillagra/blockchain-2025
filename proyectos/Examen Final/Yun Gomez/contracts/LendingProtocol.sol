// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LendingProtocol
 * @dev Decentralized lending protocol with collateral-backed loans
 */
contract LendingProtocol is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token contracts
    IERC20 public immutable collateralToken;
    IERC20 public immutable loanToken;

    // Protocol parameters
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150%
    uint256 public constant INTEREST_RATE = 5; // 5% per period
    uint256 public constant PRECISION = 100;

    // User data structure
    struct UserData {
        uint256 collateralBalance;
        uint256 loanBalance;
        uint256 lastInterestUpdate;
        uint256 accruedInterest;
    }

    // State variables
    mapping(address => UserData) public users;
    uint256 public totalCollateral;
    uint256 public totalLoans;

    // Events
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
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
     * @dev Deposit collateral tokens
     * @param amount Amount of collateral tokens to deposit
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = users[msg.sender];
        
        // Update interest before modifying user data
        _updateUserInterest(msg.sender);
        
        // Transfer collateral tokens from user
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user and global state
        user.collateralBalance += amount;
        totalCollateral += amount;
        
        emit CollateralDeposited(msg.sender, amount);
    }

    /**
     * @dev Borrow loan tokens against collateral
     * @param amount Amount of loan tokens to borrow
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        UserData storage user = users[msg.sender];
        
        // Update interest before modifying user data
        _updateUserInterest(msg.sender);
        
        // Calculate maximum borrowable amount (66.67% of collateral value)
        uint256 maxBorrowable = (user.collateralBalance * PRECISION) / COLLATERALIZATION_RATIO;
        uint256 currentDebt = user.loanBalance + user.accruedInterest;
        
        require(currentDebt + amount <= maxBorrowable, "Exceeds collateralization ratio");
        require(loanToken.balanceOf(address(this)) >= amount, "Insufficient liquidity");
        
        // Update user state
        user.loanBalance += amount;
        totalLoans += amount;
        
        // Transfer loan tokens to user
        loanToken.safeTransfer(msg.sender, amount);
        
        emit LoanBorrowed(msg.sender, amount);
    }

    /**
     * @dev Repay loan with interest
     */
    function repay() external nonReentrant {
        UserData storage user = users[msg.sender];
        
        // Update interest before repayment
        _updateUserInterest(msg.sender);
        
        uint256 totalDebt = user.loanBalance + user.accruedInterest;
        require(totalDebt > 0, "No outstanding debt");
        
        // Transfer repayment from user
        loanToken.safeTransferFrom(msg.sender, address(this), totalDebt);
        
        // Update user state
        totalLoans -= user.loanBalance;
        user.loanBalance = 0;
        user.accruedInterest = 0;
        user.lastInterestUpdate = block.timestamp;
        
        emit LoanRepaid(msg.sender, user.loanBalance, user.accruedInterest);
    }

    /**
     * @dev Withdraw collateral (only if no outstanding debt)
     */
    function withdrawCollateral() external nonReentrant {
        UserData storage user = users[msg.sender];
        
        // Update interest to get current debt
        _updateUserInterest(msg.sender);
        
        require(user.loanBalance + user.accruedInterest == 0, "Outstanding debt exists");
        require(user.collateralBalance > 0, "No collateral to withdraw");
        
        uint256 amount = user.collateralBalance;
        
        // Update state
        user.collateralBalance = 0;
        totalCollateral -= amount;
        
        // Transfer collateral back to user
        collateralToken.safeTransfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get user data including current interest
     * @param user Address of the user
     * @return collateralBalance Current collateral balance
     * @return loanBalance Current loan balance
     * @return accruedInterest Current accrued interest
     * @return totalDebt Total debt (loan + interest)
     */
    function getUserData(address user) external view returns (
        uint256 collateralBalance,
        uint256 loanBalance,
        uint256 accruedInterest,
        uint256 totalDebt
    ) {
        UserData memory userData = users[user];
        
        // Calculate current interest without modifying state (view function)
        if (userData.loanBalance > 0 && userData.lastInterestUpdate > 0) {
            uint256 timeElapsed = block.timestamp - userData.lastInterestUpdate;
            // Simple interest calculation (5% per week = 5% per 604800 seconds)
            uint256 weeklyInterest = (userData.loanBalance * INTEREST_RATE * timeElapsed) / (PRECISION * 604800);
            userData.accruedInterest += weeklyInterest;
        }
        
        return (
            userData.collateralBalance,
            userData.loanBalance,
            userData.accruedInterest,
            userData.loanBalance + userData.accruedInterest
        );
    }

    /**
     * @dev Update user interest in storage (non-view function)
     * @param userAddress Address of the user to update
     */
    function updateUserInterest(address userAddress) external {
        _updateUserInterest(userAddress);
    }

    /**
     * @dev Internal function to update user interest
     * @param userAddress Address of the user
     */
    function _updateUserInterest(address userAddress) internal {
        UserData storage user = users[userAddress];
        
        if (user.loanBalance > 0) {
            if (user.lastInterestUpdate == 0) {
                // First time borrowing - set the timestamp for future calculations
                user.lastInterestUpdate = block.timestamp;
            } else {
                uint256 timeElapsed = block.timestamp - user.lastInterestUpdate;
                if (timeElapsed > 0) {
                    // Simple interest: 5% per week
                    uint256 weeklyInterest = (user.loanBalance * INTEREST_RATE * timeElapsed) / (PRECISION * 604800);
                    user.accruedInterest += weeklyInterest;
                    user.lastInterestUpdate = block.timestamp;
                }
            }
        }
    }

    /**
     * @dev Emergency function to withdraw tokens (only owner)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Get protocol statistics
     * @return totalCollateralDeposited Total collateral in the protocol
     * @return totalLoansOutstanding Total loans outstanding
     * @return protocolLiquidity Available loan token liquidity
     */
    function getProtocolStats() external view returns (
        uint256 totalCollateralDeposited,
        uint256 totalLoansOutstanding,
        uint256 protocolLiquidity
    ) {
        return (
            totalCollateral,
            totalLoans,
            loanToken.balanceOf(address(this))
        );
    }
}