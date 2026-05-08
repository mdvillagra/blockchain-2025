import { ethers } from "hardhat";

export async function deployContracts() {
    const [deployer, user1, user2] = await ethers.getSigners();

    // Deploy tokens
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const collateralToken = await CollateralToken.deploy();

    const LoanToken = await ethers.getContractFactory("LoanToken");
    const loanToken = await LoanToken.deploy();

    // Deploy lending protocol
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    const lendingProtocol = await LendingProtocol.deploy(
        await collateralToken.getAddress(),
        await loanToken.getAddress()
    );

    // Transfer some tokens to the lending protocol for liquidity
    const liquidityAmount = ethers.parseEther("100000");
    await loanToken.transfer(await lendingProtocol.getAddress(), liquidityAmount);

    // Transfer some collateral tokens to test users
    const userAmount = ethers.parseEther("10000");
    await collateralToken.transfer(user1.address, userAmount);
    await collateralToken.transfer(user2.address, userAmount);

    return {
        collateralToken,
        loanToken,
        lendingProtocol,
        deployer,
        user1,
        user2,
    };
} 