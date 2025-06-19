// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DeFi Lending Protocol
/// @notice Allows users to deposit cUSD as collateral and borrow dDAI with fixed interest
contract DeFiLending is Ownable, ReentrancyGuard {
    IERC20 public immutable collateralToken;
    IERC20 public immutable loanToken;

    uint256 public constant MIN_COLLATERAL_RATIO = 15000; // 150% (in basis points)
    uint256 public constant WEEKLY_INTEREST_RATE   = 500;   // 5% weekly
    uint256 public constant BASIS_POINTS           = 10000; // 100%

    struct Position {
        uint256 collateral;
        uint256 debt;
        uint256 lastUpdate;
        uint256 accruedInterest;
    }

    mapping(address => Position) private positions;

    event CollateralAdded(address indexed user, uint256 amount);
    event LoanDrawn(address indexed user, uint256 amount);
    event DebtRepaid(address indexed user, uint256 principal, uint256 interest);
    event CollateralRemoved(address indexed user, uint256 amount);

    /// @notice Deploy protocol, setting token addresses and owner
    /// @param _collateral Address of the cUSD token
    /// @param _loan       Address of the dDAI token
    constructor(address _collateral, address _loan)
        Ownable(msg.sender)
    {
        collateralToken = IERC20(_collateral);
        loanToken       = IERC20(_loan);
    }

    /// @notice Deposit cUSD tokens as collateral
    function addCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        Position storage p = positions[msg.sender];
        _updateInterest(msg.sender);
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        p.collateral += amount;
        emit CollateralAdded(msg.sender, amount);
    }

    /// @notice Borrow dDAI against your collateral
    function drawLoan(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        Position storage p = positions[msg.sender];
        require(p.collateral > 0, "No collateral");
        _updateInterest(msg.sender);
        uint256 maxBorrow = (p.collateral * BASIS_POINTS) / MIN_COLLATERAL_RATIO;
        require(p.debt + p.accruedInterest + amount <= maxBorrow, "Exceeds max borrow");
        p.debt += amount;
        require(loanToken.transfer(msg.sender, amount), "Loan transfer failed");
        emit LoanDrawn(msg.sender, amount);
    }

    /// @notice Repay outstanding debt including interest
    function repayDebt() external nonReentrant {
        Position storage p = positions[msg.sender];
        _updateInterest(msg.sender);
        uint256 owed = p.debt + p.accruedInterest;
        require(owed > 0, "Nothing to repay");
        require(loanToken.transferFrom(msg.sender, address(this), owed), "Repay failed");
        uint256 principal = p.debt;
        uint256 interest  = p.accruedInterest;
        p.debt = 0;
        p.accruedInterest = 0;
        emit DebtRepaid(msg.sender, principal, interest);
    }

    /// @notice Withdraw collateral if no outstanding debt
    function removeCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        Position storage p = positions[msg.sender];
        _updateInterest(msg.sender);
        require(p.debt + p.accruedInterest == 0, "Debt exists");
        require(p.collateral >= amount, "Insufficient collateral");
        p.collateral -= amount;
        require(collateralToken.transfer(msg.sender, amount), "Withdraw failed");
        emit CollateralRemoved(msg.sender, amount);
    }

    /// @dev Internal: update accrued interest based on elapsed weeks
    function _updateInterest(address user) internal {
        Position storage p = positions[user];
        if (p.lastUpdate == 0) {
            p.lastUpdate = block.timestamp;
            return;
        }
        uint256 elapsed = block.timestamp - p.lastUpdate;
        if (elapsed < 1 weeks || p.debt == 0) {
            p.lastUpdate = block.timestamp;
            return;
        }
        uint256 weeksElapsed = elapsed / 1 weeks;
        uint256 interest = (p.debt * WEEKLY_INTEREST_RATE * weeksElapsed) / BASIS_POINTS;
        p.accruedInterest += interest;
        p.lastUpdate += weeksElapsed * 1 weeks;
    }

    /// @notice View your position: (collateral, debt, interest)
    function fetchPosition(address user)
        external
        view
        returns (uint256 collateral, uint256 debt, uint256 interest)
    {
        Position storage p = positions[user];
        uint256 pending = 0;
        if (p.lastUpdate > 0 && p.debt > 0) {
            uint256 elapsed = block.timestamp - p.lastUpdate;
            uint256 weeksElapsed = elapsed / 1 weeks;
            pending = (p.debt * WEEKLY_INTEREST_RATE * weeksElapsed) / BASIS_POINTS;
        }
        return (p.collateral, p.debt, p.accruedInterest + pending);
    }

    /// @notice Owner rescue function for any ERC20 sent by mistake
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
