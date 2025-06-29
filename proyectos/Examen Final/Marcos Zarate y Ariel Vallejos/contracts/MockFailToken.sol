// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockFailToken is ERC20 {
    constructor() ERC20("FailToken", "FTK") {}

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        return false; // Fuerza el fallo
    }
}
