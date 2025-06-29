// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}


    
    /**
     * @dev Función para mint más tokens (solo owner)
     * @param to Dirección destino
     * @param amount Cantidad a mintear
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Función para quemar tokens
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Función para quemar tokens de otra dirección (con allowance)
     * @param from Dirección desde donde quemar
     * @param amount Cantidad a quemar
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
}