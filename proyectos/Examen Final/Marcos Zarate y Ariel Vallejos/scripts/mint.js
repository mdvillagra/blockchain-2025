const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();

    const collateralTokenAddress = process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS;
    const loanTokenAddress = process.env.NEXT_PUBLIC_LOAN_TOKEN_ADDRESS;

    const CollateralToken = await ethers.getContractAt("CollateralToken", collateralTokenAddress);
    const LoanToken = await ethers.getContractAt("LoanToken", loanTokenAddress);

    const amount_cusd = ethers.parseUnits("1000", 18); // 1000 cUSD
    const amount_ddai = ethers.parseUnits("500", 18);  // 500 dDAI

    // ✅ Mint cUSD
    console.log("⏳ Minting cUSD...");
    const tx1 = await CollateralToken.mint(deployer.address, amount_cusd);
    await tx1.wait();
    console.log(`✅ Se mintearon ${ethers.formatUnits(amount_cusd, 18)} cUSD a ${deployer.address}`);

    // ✅ Mint dDAI
    console.log("⏳ Minting dDAI...");
    const tx2 = await LoanToken.mint(deployer.address, amount_ddai);
    await tx2.wait();
    console.log(`✅ Se mintearon ${ethers.formatUnits(amount_ddai, 18)} dDAI a ${deployer.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
