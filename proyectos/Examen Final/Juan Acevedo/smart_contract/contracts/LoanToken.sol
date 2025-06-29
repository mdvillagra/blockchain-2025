// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Token ERC20 para préstamos (dDAI)
/// @notice Token utilizado para préstamos en el protocolo
contract LoanToken is ERC20, Ownable {
    /// @notice Inicializa el token dDAI
    /// @param initialOwner Dirección del propietario inicial
    constructor(address initialOwner) 
        ERC20("Decentralized DAI", "dDAI") 
        Ownable(initialOwner) 
    {}

    /// @notice Emite nuevos tokens dDAI
    /// @param to Dirección que recibirá los tokens
    /// @param amount Cantidad de tokens a emitir
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}