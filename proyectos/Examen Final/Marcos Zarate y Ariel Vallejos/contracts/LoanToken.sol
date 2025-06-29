// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoanToken is ERC20, Ownable {
    mapping(address => bool) public isMinter;

    constructor() ERC20("Decentralized DAI", "dDAI") Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        isMinter[_minter] = true;
    }

    function mint(address to, uint256 amount) external {
        require(isMinter[msg.sender], "No autorizado");
        _mint(to, amount);
    }
}
