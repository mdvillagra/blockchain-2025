// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LendingProtocol {
    IERC20 public collateralToken;
    IERC20 public loanToken;

    uint256 public interestRate = 5; // 5% fijo por periodo simulado
    uint256 public collateralizationRatio = 150; // 150%

    struct UserData {
        uint256 collateral;
        uint256 debt;
        uint256 interest;
    }

    mapping(address => UserData) public users;

    constructor(address _collateralToken, address _loanToken) {
        collateralToken = IERC20(_collateralToken);
        loanToken = IERC20(_loanToken);
    }

    function depositCollateral(uint256 amount) external {
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        users[msg.sender].collateral += amount;
    }

    function borrow(uint256 amount) external {
        UserData storage user = users[msg.sender];
        uint256 maxLoan = (user.collateral * 100) / collateralizationRatio;
        require(user.debt + amount <= maxLoan, "Exceeds borrowing limit");

        user.debt += amount;
        require(loanToken.transfer(msg.sender, amount), "Loan transfer failed");
    }

    function repay() external {
        UserData storage user = users[msg.sender];
        uint256 totalDebt = user.debt + ((user.debt * interestRate) / 100);
        require(loanToken.transferFrom(msg.sender, address(this), totalDebt), "Repayment failed");

        user.debt = 0;
        user.interest = 0;
    }

    function withdrawCollateral() external {
        UserData storage user = users[msg.sender];
        require(user.debt == 0, "Debt outstanding");

        uint256 amount = user.collateral;
        user.collateral = 0;
        require(collateralToken.transfer(msg.sender, amount), "Withdraw failed");
    }

    function getUserData(address userAddr) external view returns (uint256, uint256, uint256) {
        UserData memory user = users[userAddr];
        return (user.collateral, user.debt, (user.debt * interestRate) / 100);
    }
}

