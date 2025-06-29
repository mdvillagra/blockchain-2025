// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CollateralToken.sol";
import "./LoanToken.sol";

contract LendingProtocol {
    CollateralToken public collateralToken;
    LoanToken public loanToken;
    address public owner;

    uint256 public constant COLLATERAL_RATIO = 150; // 150%
    uint256 public constant INTEREST_RATE = 5; // 5% fijo

    struct Position {
        uint256 collateralAmount;
        uint256 debtAmount;
        uint256 interestAccrued;
    }

    mapping(address => Position) public positions;

    constructor(address _collateral, address _loan) {
        collateralToken = CollateralToken(_collateral);
        loanToken = LoanToken(_loan);
        owner = msg.sender;
    }

    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Cantidad invalida");

        // Asegura que el usuario haya hecho approve antes
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Transferencia fallida"
        );

        positions[msg.sender].collateralAmount += amount;

        emit CollateralDeposited(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        Position storage user = positions[msg.sender];

        require(user.collateralAmount > 0, "No hay colateral");

        uint256 maxBorrow = (user.collateralAmount * 100) / COLLATERAL_RATIO;
        require(amount <= maxBorrow, "Excede el limite de prestamo");

        user.debtAmount += amount;
        user.interestAccrued += (amount * INTEREST_RATE) / 100;

        loanToken.mint(msg.sender, amount);
    }

    function repay() external {
        Position storage user = positions[msg.sender];
        require(user.debtAmount > 0, "No hay deuda");

        uint256 totalOwed = user.debtAmount + user.interestAccrued;

        loanToken.transferFrom(msg.sender, address(this), totalOwed);

        user.debtAmount = 0;
        user.interestAccrued = 0;
    }

    function withdrawCollateral() external {
        Position storage user = positions[msg.sender];
        require(user.debtAmount == 0, "Primero paga la deuda");

        uint256 amount = user.collateralAmount;
        require(amount > 0, "Nada para retirar");

        user.collateralAmount = 0;
        collateralToken.transfer(msg.sender, amount);
    }

    function getUserData(address userAddress)
        external
        view
        returns (
            uint256 collateral,
            uint256 debt,
            uint256 interest
        )
    {
        Position memory p = positions[userAddress];
        return (p.collateralAmount, p.debtAmount, p.interestAccrued);
    }

    event CollateralDeposited(address indexed user, uint256 amount);
}
