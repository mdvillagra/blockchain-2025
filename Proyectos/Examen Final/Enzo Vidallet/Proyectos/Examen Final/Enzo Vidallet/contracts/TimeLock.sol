// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Timelock Simple
/// @notice Retiene Ether hasta una fecha de liberación y luego permite el retiro
contract TimeLock {
    uint256 public releaseTime;
    address payable public beneficiary;

    event LockedRelease(uint256 amount, uint256 timestamp);

    /// @notice Crea timelock con timestamp futuro
    constructor(uint256 _releaseTime) payable {
        require(_releaseTime > block.timestamp, "Release time must be future");
        releaseTime = _releaseTime;
        beneficiary = payable(msg.sender);
    }

    /// @notice Retira Ether tras la fecha de liberación
    function withdraw() external {
        require(block.timestamp >= releaseTime, "Not yet unlocked");
        require(msg.sender == beneficiary, "Unauthorized");
        uint256 bal = address(this).balance;
        emit LockedRelease(bal, block.timestamp);
        beneficiary.transfer(bal);
    }
}
