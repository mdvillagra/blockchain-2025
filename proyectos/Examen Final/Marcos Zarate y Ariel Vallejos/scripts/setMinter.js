const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();

    // Direcciones de contratos en Sepolia
    const collateralTokenAddress = process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS;
    const loanTokenAddress = process.env.NEXT_PUBLIC_LOAN_TOKEN_ADDRESS;
    const lendingProtocolAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;


    // Instancias de contrato
    const CollateralToken = await ethers.getContractAt("CollateralToken", collateralTokenAddress);
    const LoanToken = await ethers.getContractAt("LoanToken", loanTokenAddress);

    // 🟩 Autorizar LendingProtocol como minter de dDAI
    console.log("⏳ Autorizando LendingProtocol como minter en LoanToken...");
    const tx1 = await LoanToken.setMinter(lendingProtocolAddress);
    await tx1.wait();
    console.log("✅ LendingProtocol autorizado como minter en dDAI");

    // 🟩 Mint tokens al deployer
    const amount_cusd = ethers.parseUnits("1000", 18);
    const amount_ddai = ethers.parseUnits("500", 18);

    console.log("⏳ Minteando cUSD al deployer...");
    const tx2 = await CollateralToken.mint(deployer.address, amount_cusd);
    await tx2.wait();
    console.log(`✅ ${ethers.formatUnits(amount_cusd)} cUSD minteados`);

    console.log("⏳ Minteando dDAI al deployer...");
    const tx3 = await LoanToken.mint(deployer.address, amount_ddai);
    await tx3.wait();
    console.log(`✅ ${ethers.formatUnits(amount_ddai)} dDAI minteados`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
