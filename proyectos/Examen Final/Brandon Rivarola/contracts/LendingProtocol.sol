// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingProtocol is Ownable 
{
    address public collateralTokenAddress;
    address public loanTokenAddress;

    mapping(address => uint256) public collateralBalances;
    mapping(address => uint256) public loanBalances;
    mapping(address => uint256) public accruedInterest;

    uint256 public constant COLLATERAL_RATIO = 150;
    uint256 public constant INTEREST_RATE = 5;

    constructor(address _collateralToken, address _loanToken) Ownable(msg.sender)
    {
        collateralTokenAddress = _collateralToken;
        loanTokenAddress = _loanToken;
    }

    function depositCollateral(uint256 amount) external 
    {
        require(amount > 0, "Debes depositar una cantidad valida.");
        IERC20(collateralTokenAddress).transferFrom(msg.sender, address(this), amount);
        collateralBalances[msg.sender] += amount;
    }

    function borrow(uint256 amount) external 
    {
        uint256 maxBorrow = (collateralBalances[msg.sender] * 100) / COLLATERAL_RATIO;
        require(amount <= maxBorrow, "No cumple con el ratio de colateralizacion.");
        loanBalances[msg.sender] += amount;
        IERC20(loanTokenAddress).transfer(msg.sender, amount);
    }

    // Acumula el 5% de interés simple semanal sobre la deuda pendiente del usuario
    function accrueInterest(address user) public {
        uint256 debt = loanBalances[user];
        require(debt > 0, "No hay deuda activa.");
        uint256 interest = (debt * INTEREST_RATE) / 100;
        accruedInterest[user] += interest;
    }

    function repay() external 
    {
        // Solo acumula el interés si no se ha hecho explícitamente
        // y hay una deuda pendiente
        uint256 totalDebt = loanBalances[msg.sender] + accruedInterest[msg.sender];
        if (loanBalances[msg.sender] > 0 && accruedInterest[msg.sender] == 0) {
            accrueInterest(msg.sender);
            totalDebt = loanBalances[msg.sender] + accruedInterest[msg.sender]; // Recalcula después de acumular
        }
        
        if (totalDebt == 0) return; // No hay nada que pagar
        
        require(IERC20(loanTokenAddress).balanceOf(msg.sender) >= totalDebt, "Saldo insuficiente.");
        IERC20(loanTokenAddress).transferFrom(msg.sender, address(this), totalDebt);
        loanBalances[msg.sender] = 0;
        accruedInterest[msg.sender] = 0;
    }

    function withdrawCollateral() external 
    {
        require(collateralBalances[msg.sender] > 0, "No tienes colateral para retirar.");
        require(loanBalances[msg.sender] == 0, "Aun tienes deuda activa.");
        uint256 amount = collateralBalances[msg.sender];
        collateralBalances[msg.sender] = 0;
        IERC20(collateralTokenAddress).transfer(msg.sender, amount);
    }

    function getUserData(address user) external view returns (uint256 collateral, uint256 debt, uint256 interest) {
        collateral = collateralBalances[user];
        debt = loanBalances[user];
        interest = accruedInterest[user];
    }
}

