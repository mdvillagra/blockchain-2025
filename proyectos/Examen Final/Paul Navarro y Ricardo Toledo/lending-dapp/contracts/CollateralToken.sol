// . SPDX-License-Identifier: MIT 
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralToken is ERC20, Ownable {
    constructor() ERC20("Collateral USD", "cUSD") Ownable(msg.sender) {}

    // Función mint pública para desarrollo - cualquier cuenta puede mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // Función mint restringida al owner (para producción)
    function mintByOwner(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

