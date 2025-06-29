// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILoanToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

contract LendingProtocol {
    IERC20 public collateralToken;
    ILoanToken public loanToken;

    uint256 public constant INTEREST_RATE_PER_WEEK = 5; // 5%
    uint256 public constant COLLATERALIZATION_RATIO = 150; // 150%
    uint256 private constant SECONDS_IN_A_WEEK = 7 days;

    struct UserData {
        uint256 collateral;
        uint256 debt;
        uint256 lastUpdateTimestamp;
    }

    mapping(address => UserData) public users;

    constructor(address _collateralToken, address _loanToken) {
        collateralToken = IERC20(_collateralToken);
        loanToken = ILoanToken(_loanToken);
    }

    function _calculateInterest(address userAddr) internal view returns (uint256) {
        UserData storage user = users[userAddr];
        if (user.debt == 0 || user.lastUpdateTimestamp == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - user.lastUpdateTimestamp;
        uint256 weeksPassed = timeElapsed / SECONDS_IN_A_WEEK;

        if (weeksPassed == 0) {
            return 0;
        }
        
        return (user.debt * INTEREST_RATE_PER_WEEK * weeksPassed) / 100;
    }

    function _accrueInterest() internal {
        uint256 accruedInterest = _calculateInterest(msg.sender);
        if (accruedInterest > 0) {
            users[msg.sender].debt += accruedInterest;
            users[msg.sender].lastUpdateTimestamp = block.timestamp;
        }
    }

    function depositCollateral(uint256 amount) external {
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        _accrueInterest();
        users[msg.sender].collateral += amount;
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "Borrow amount must be positive");
        _accrueInterest();

        UserData storage user = users[msg.sender];
        uint256 maxLoan = (user.collateral * 100) / COLLATERALIZATION_RATIO;
        require(user.debt + amount <= maxLoan, "Exceeds borrowing limit");

        if (user.debt == 0) {
            user.lastUpdateTimestamp = block.timestamp;
        }
        user.debt += amount;

        loanToken.mint(msg.sender, amount);
    }

    function repay() external {
        _accrueInterest();
        
        UserData storage user = users[msg.sender];
        uint256 totalDebt = user.debt;
        require(totalDebt > 0, "No debt to repay");

        loanToken.burnFrom(msg.sender, totalDebt);

        user.debt = 0;
        user.lastUpdateTimestamp = 0;
    }

    function withdrawCollateral() external {
        _accrueInterest();

        UserData storage user = users[msg.sender];
        require(user.debt == 0, "Debt outstanding");

        uint256 amount = user.collateral;
        user.collateral = 0;
        require(collateralToken.transfer(msg.sender, amount), "Withdraw failed");
    }

    function getUserData(address userAddr) external view returns (uint256, uint256, uint256) {
        UserData memory user = users[userAddr];
        uint256 accruedInterest = _calculateInterest(userAddr);
        return (user.collateral, user.debt, accruedInterest);
    }
}

