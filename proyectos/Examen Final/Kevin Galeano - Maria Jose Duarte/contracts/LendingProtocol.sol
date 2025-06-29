// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LendingProtocol is Ownable, ReentrancyGuard {
    IERC20 public immutable collateralToken; // cUSD
    IERC20 public immutable loanToken; // dDAI

    // Constants
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150% collateralization
    uint256 public constant INTEREST_RATE = 5; // 5% weekly interest
    uint256 public constant PRECISION = 100;

    // User data structure
    struct UserPosition {
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 lastInterestUpdate;
        uint256 accumulatedInterest;
    }

    mapping(address => UserPosition) public userPositions;

    // Events
    event CollateralDeposited(address indexed user, uint256 amount);
    event LoanBorrowed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    constructor(
        address _collateralToken,
        address _loanToken,
        address initialOwner
    ) Ownable(initialOwner) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    /**
     * @dev Deposit collateral tokens (cUSD)
     * @param amount Amount of collateral to deposit
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        UserPosition storage position = userPositions[msg.sender];

        // Transfer collateral from user to contract
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Collateral transfer failed"
        );

        position.collateralAmount += amount;

        emit CollateralDeposited(msg.sender, amount);
    }

    /**
     * @dev Borrow loan tokens (dDAI) against collateral
     * @param amount Amount to borrow
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        UserPosition storage position = userPositions[msg.sender];
        require(position.collateralAmount > 0, "No collateral deposited");

        // Update interest before calculating new loan
        _updateInterest(msg.sender);

        // Calculate maximum borrowable amount (66.67% of collateral due to 150% ratio)
        uint256 maxBorrowable = (position.collateralAmount * PRECISION) /
            COLLATERALIZATION_RATIO;
        uint256 currentDebt = position.loanAmount +
            position.accumulatedInterest;

        require(
            currentDebt + amount <= maxBorrowable,
            "Exceeds borrowing capacity"
        );

        // Check contract has enough loan tokens
        require(
            loanToken.balanceOf(address(this)) >= amount,
            "Insufficient loan tokens in contract"
        );

        position.loanAmount += amount;
        position.lastInterestUpdate = block.timestamp;

        // Transfer loan tokens to user
        require(loanToken.transfer(msg.sender, amount), "Loan transfer failed");

        emit LoanBorrowed(msg.sender, amount);
    }

    /**
     * @dev Repay loan with accumulated interest
     */
    function repay() external nonReentrant {
        UserPosition storage position = userPositions[msg.sender];
        require(position.loanAmount > 0, "No active loan");

        // Update interest
        _updateInterest(msg.sender);

        uint256 totalDebt = position.loanAmount + position.accumulatedInterest;

        // Transfer repayment from user to contract
        require(
            loanToken.transferFrom(msg.sender, address(this), totalDebt),
            "Repayment transfer failed"
        );

        emit LoanRepaid(
            msg.sender,
            position.loanAmount,
            position.accumulatedInterest
        );

        // Reset loan position
        position.loanAmount = 0;
        position.accumulatedInterest = 0;
        position.lastInterestUpdate = 0;
    }

    /**
     * @dev Withdraw collateral (only if no active debt)
     */
    function withdrawCollateral() external nonReentrant {
        UserPosition storage position = userPositions[msg.sender];
        require(position.collateralAmount > 0, "No collateral to withdraw");

        // Update interest to get current debt
        if (position.loanAmount > 0) {
            _updateInterest(msg.sender);
        }

        uint256 currentDebt = position.loanAmount +
            position.accumulatedInterest;
        require(currentDebt == 0, "Cannot withdraw with active debt");

        uint256 collateralAmount = position.collateralAmount;
        position.collateralAmount = 0;

        // Transfer collateral back to user
        require(
            collateralToken.transfer(msg.sender, collateralAmount),
            "Collateral withdrawal failed"
        );

        emit CollateralWithdrawn(msg.sender, collateralAmount);
    }

    /**
     * @dev Get user position data
     * @param user User address
     * @return collateral Current collateral amount
     * @return debt Current debt amount
     * @return interest Current accumulated interest
     */
    function getUserData(
        address user
    )
        external
        view
        returns (uint256 collateral, uint256 debt, uint256 interest)
    {
        UserPosition memory position = userPositions[user];

        collateral = position.collateralAmount;
        debt = position.loanAmount;
        interest = position.accumulatedInterest;

        // Calculate current interest if there's an active loan
        if (position.loanAmount > 0 && position.lastInterestUpdate > 0) {
            uint256 timeElapsed = block.timestamp - position.lastInterestUpdate;
            uint256 weeksElapsed = timeElapsed / (7 * 24 * 60 * 60); // Convert to weeks

            if (weeksElapsed > 0) {
                uint256 newInterest = (position.loanAmount *
                    INTEREST_RATE *
                    weeksElapsed) / PRECISION;
                interest += newInterest;
            }
        }
    }

    /**
     * @dev Internal function to update accumulated interest
     * @param user User address
     */
    function _updateInterest(address user) internal {
        UserPosition storage position = userPositions[user];

        if (position.loanAmount > 0 && position.lastInterestUpdate > 0) {
            uint256 timeElapsed = block.timestamp - position.lastInterestUpdate;
            uint256 weeksElapsed = timeElapsed / (7 * 24 * 60 * 60); // Convert to weeks

            if (weeksElapsed > 0) {
                uint256 newInterest = (position.loanAmount *
                    INTEREST_RATE *
                    weeksElapsed) / PRECISION;
                position.accumulatedInterest += newInterest;
                position.lastInterestUpdate = block.timestamp;
            }
        }
    }

    /**
     * @dev Owner function to fund the contract with loan tokens
     * @param amount Amount of loan tokens to fund
     */
    function fundContract(uint256 amount) external onlyOwner {
        require(
            loanToken.transferFrom(msg.sender, address(this), amount),
            "Funding transfer failed"
        );
    }

    /**
     * @dev Owner function to withdraw excess loan tokens
     * @param amount Amount to withdraw
     */
    function withdrawExcess(uint256 amount) external onlyOwner {
        require(loanToken.transfer(msg.sender, amount), "Withdrawal failed");
    }
}
