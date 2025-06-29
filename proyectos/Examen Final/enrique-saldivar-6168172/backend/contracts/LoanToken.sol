// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoanToken
 * @dev Token ERC20 para préstamos (dDAI)
 */
contract LoanToken is ERC20, Ownable {
    constructor() ERC20("Decentralized DAI", "dDAI") Ownable(msg.sender) {
        // Mint inicial de tokens para testing
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Función para mintear tokens - solo el owner puede hacerlo
     * @param to Dirección a la que se enviarán los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
