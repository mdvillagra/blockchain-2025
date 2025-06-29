// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Token ERC20 para colateral (cUSD)
/// @notice Token utilizado como colateral en el protocolo de préstamos
contract CollateralToken is ERC20, Ownable {
    /// @notice Inicializa el token cUSD
    /// @param initialOwner Dirección del propietario inicial
    constructor(address initialOwner) 
        ERC20("Collateral USD", "cUSD") 
        Ownable(initialOwner) 
    {}

    /// @notice Emite nuevos tokens cUSD
    /// @param to Dirección que recibirá los tokens
    /// @param amount Cantidad de tokens a emitir
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}