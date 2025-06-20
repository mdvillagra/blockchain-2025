// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CollateralToken.sol";
import "./LoanToken.sol";
contract LendingProtocol {
    CollateralToken public collateralToken;
    LoanToken public loanToken;
event Repaid(address indexed user, uint256 totalAmount);
event CollateralWithdrawn(address indexed user, uint256 amount);
    mapping(address => uint256) public collateralBalances;
    mapping(address => uint256) public loanBalances;

    constructor(address _collateralToken, address _loanToken) {
        collateralToken = CollateralToken(_collateralToken);
        loanToken = LoanToken(_loanToken);
    }

    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        collateralToken.transferFrom(msg.sender, address(this), amount);
        collateralBalances[msg.sender] += amount;
    }

    function borrow(uint256 amount) external {
        uint256 collateral = collateralBalances[msg.sender];
        require(collateral > 0, "No collateral deposited");

        uint256 maxBorrow = (collateral * 50) / 100;
        require(amount <= maxBorrow, "Exceeds allowed borrow amount");

        uint256 available = loanToken.balanceOf(address(this));
        require(available >= amount, "Not enough liquidity");

        loanBalances[msg.sender] += amount;
        loanToken.transfer(msg.sender, amount);
    }
    function repay() external {
    uint256 debt = loanBalances[msg.sender];
    require(debt > 0, "No active loan");

    uint256 interest = debt / 20; // 5% interés
    uint256 totalOwed = debt + interest;

    require(
        loanToken.transferFrom(msg.sender, address(this), totalOwed),
        "Transfer failed"
    );

    loanBalances[msg.sender] = 0;
    emit Repaid(msg.sender, totalOwed);
}
function withdrawCollateral() external {
    require(loanBalances[msg.sender] == 0, "Debt must be repaid");
    uint256 amount = collateralBalances[msg.sender];
    require(amount > 0, "No collateral to withdraw");

    collateralBalances[msg.sender] = 0;
    require(collateralToken.transfer(msg.sender, amount), "Transfer failed");

    emit CollateralWithdrawn(msg.sender, amount);
}

}
