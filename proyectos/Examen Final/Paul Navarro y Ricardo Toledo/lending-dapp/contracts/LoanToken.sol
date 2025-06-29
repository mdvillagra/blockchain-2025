// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract LoanToken is ERC20, Ownable, ERC20Burnable {
    constructor() ERC20("Debt DAI", "dDAI") Ownable(msg.sender) {}

    // Función mint pública para desarrollo - cualquier cuenta puede mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // Función mint restringida al owner (para producción)
    function mintByOwner(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

