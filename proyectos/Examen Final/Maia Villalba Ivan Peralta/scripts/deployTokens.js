const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with:", deployer.address);

    const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
    const collateral = await CollateralToken.deploy(deployer.address);
    await collateral.waitForDeployment();

    const LoanToken = await hre.ethers.getContractFactory("LoanToken");
    const loan = await LoanToken.deploy(deployer.address);
    await loan.waitForDeployment();

    console.log(`CollateralToken deployed at: ${await collateral.getAddress()}`);
    console.log(`LoanToken deployed at: ${await loan.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
