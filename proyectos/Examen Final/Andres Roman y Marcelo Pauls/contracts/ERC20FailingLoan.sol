// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title ERC20FailingLoan
/// @notice Mock de ERC20 cuyo transferFrom siempre devuelve false.
///         Sirve para cubrir la rama “Transfer de LoanToken para repago fallida” en repay().
contract ERC20FailingLoan {
    function transferFrom(address, address, uint256) external pure returns (bool) {
        return false;
    }
}