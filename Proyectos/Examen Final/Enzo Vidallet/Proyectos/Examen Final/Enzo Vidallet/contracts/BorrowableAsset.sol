// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title dDAI Loan Token
/// @notice ERC20 token used as the loan asset in the lending protocol
contract BorrowableAsset is ERC20, Ownable {
    /// @notice Initialize token: set name/symbol and mint initial supply to deployer
    constructor()
        ERC20("dDAI Token", "DDAI")
        Ownable(msg.sender)
    {
        _mint(owner(), 1_000_000 * 10 ** decimals());
    }

    /// @notice Mint new loan tokens, restricted to owner
    /// @param to Address to receive minted tokens
    /// @param amount Amount of tokens to mint
    function mintTokens(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Override ERC20 decimals to 18
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
