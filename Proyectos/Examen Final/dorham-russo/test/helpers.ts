import { ethers } from "hardhat";

export async function timeTravel(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
}

export async function getLatestBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block?.timestamp || 0;
}

export function parseEther(amount: string) {
    return ethers.parseEther(amount);
}

export function formatEther(amount: bigint) {
    return ethers.formatEther(amount);
}

export async function mineBlocks(count: number) {
    for (let i = 0; i < count; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

export async function setNextBlockTimestamp(timestamp: number) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await ethers.provider.send("evm_mine", []);
} 