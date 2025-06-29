// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FailingTransfer is ERC20 {
    constructor() ERC20("Failing Transfer", "FAIL") {}
    
    // Sobrescribe transfer para siempre fallar
    function transfer(address, uint256) public pure override returns (bool) {
        return false;
    }

    // Función mint para compatibilidad con el flujo de tests
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}