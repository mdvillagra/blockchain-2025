// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralToken is ERC20, Ownable {
    constructor() ERC20("Collateral USD", "cUSD") Ownable(msg.sender) {}

    // Función para crear nuevos tokens, solo el dueño del contrato puede llamarla 
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}