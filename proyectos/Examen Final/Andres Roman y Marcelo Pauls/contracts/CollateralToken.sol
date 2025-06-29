// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CollateralToken (cUSD)
/// @notice ERC20 token que sirve como colateral. Solo el owner puede acuñar nuevos tokens.
contract CollateralToken is ERC20, Ownable {
    constructor() ERC20("CollateralToken", "cUSD") Ownable(msg.sender) {}

    /// @notice Acuñar tokens de colateral a una dirección
    /// @param to Dirección que recibirá los tokens
    /// @param amount Cantidad a acuñar (en wei, con 18 decimales)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}