// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title LoanToken (dDAI)
/// @notice ERC20 token que sirve como préstamo. Solo el owner puede acuñar nuevos tokens.
contract LoanToken is ERC20, Ownable {
    constructor() ERC20("LoanToken", "dDAI") Ownable(msg.sender) {}

    /// @notice Acuñar tokens de préstamo a una dirección
    /// @param to Dirección que recibirá los tokens
    /// @param amount Cantidad a acuñar (en wei, con 18 decimales)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
