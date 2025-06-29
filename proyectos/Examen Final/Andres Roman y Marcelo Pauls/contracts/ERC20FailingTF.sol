// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title ERC20FailingTF
/// @notice Mock de ERC20 que simula un `transferFrom` que siempre falla.
///         Úsalo para cubrir la rama “Transfer de CollateralToken fallida” en depositCollateral().
contract ERC20FailingTF {
    /// @notice Siempre devuelve false
    function transferFrom(address, address, uint256) external pure returns (bool) {
        return false;
    }
}
