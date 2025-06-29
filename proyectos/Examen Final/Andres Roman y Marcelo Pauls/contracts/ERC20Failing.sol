// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title ERC20Failing
/// @notice Mock de ERC20 que simula un `transferFrom` funcional, pero un `transfer` que siempre falla.
contract ERC20Failing {
    string public name = "FailToken";
    string public symbol = "FAIL";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Minta “amount” de tokens al contrato
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    /// @notice Aprueba a `spender` para gastar `amount` desde caller
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    /// @notice Función “failing”: siempre devuelve false
    /// @dev Se declara `pure` y se omiten nombres de parámetros para silenciar advertencias.
    function transfer(address /*to*/, uint256 /*amount*/) external pure returns (bool) {
        return false;
    }

    /// @notice Función “working”: mueve balances y devuelve true
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}