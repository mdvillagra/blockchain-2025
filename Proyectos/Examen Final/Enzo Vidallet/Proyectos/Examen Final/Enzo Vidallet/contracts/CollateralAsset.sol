// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title cUSD Collateral Token
/// @notice ERC20 token used as collateral in the lending protocol
contract CollateralAsset is ERC20, Ownable {
    /// @notice Initialize token: set name/symbol and mint initial supply to deployer
    constructor()
        ERC20("cUSD Token", "CUSD")
        Ownable(msg.sender)
    {
        _mint(owner(), 1_000_000 * 10 ** decimals());
    }

    /// @notice Mint additional tokens, restricted to owner
    /// @param to Recipient address
    /// @param amount Amount to mint
    function issueTokens(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Override ERC20 decimals to 18
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
