// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract LendingProtocol {
    IERC20 public collateralToken;
    IERC20 public loanToken;

    uint256 public interestRate = 5; // 5% fijo por semana
    uint256 public collateralizationRatio = 150; // 150%

    struct Position {
        uint256 collateral;
        uint256 debt;
        uint256 interest;
    }

    mapping(address => Position) public positions;

    constructor(address _collateral, address _loan) {
        collateralToken = IERC20(_collateral);
        loanToken = IERC20(_loan);
    }

    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Monto invalido");

        collateralToken.transferFrom(msg.sender, address(this), amount);
        positions[msg.sender].collateral += amount;
    }

    function borrow(uint256 amount) external {
        Position storage pos = positions[msg.sender];

        uint256 maxBorrow = (pos.collateral * 100) / collateralizationRatio;
        require(amount <= maxBorrow, "Excede el colateral disponible");
        require(pos.debt == 0, "Debe pagar su deuda actual");

        pos.debt = amount;
        pos.interest = (amount * interestRate) / 100;

        loanToken.transfer(msg.sender, amount);
    }

    function repay() external {
        Position storage pos = positions[msg.sender];
        require(pos.debt > 0, "No hay deuda");

        uint256 total = pos.debt + pos.interest;
        loanToken.transferFrom(msg.sender, address(this), total);

        pos.debt = 0;
        pos.interest = 0;
    }

    function withdrawCollateral() external {
        Position storage pos = positions[msg.sender];
        require(pos.debt == 0, "Deuda pendiente");

        uint256 amount = pos.collateral;
        require(amount > 0, "No hay colateral");

        pos.collateral = 0;
        collateralToken.transfer(msg.sender, amount);
    }

    function getUserData(address user) external view returns (uint256, uint256, uint256) {
        Position memory pos = positions[user];
        return (pos.collateral, pos.debt, pos.interest);
    }
}
