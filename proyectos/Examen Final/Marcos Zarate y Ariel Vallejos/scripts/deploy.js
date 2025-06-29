const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Desplegando contratos con la cuenta:", deployer.address);

    const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
    const collateral = await CollateralToken.deploy();
    console.log("CollateralToken (cUSD) deployado en:", await collateral.getAddress());

    const LoanToken = await hre.ethers.getContractFactory("LoanToken");
    const loan = await LoanToken.deploy();
    console.log("LoanToken (dDAI) deployado en:", await loan.getAddress());

    const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
    const protocol = await LendingProtocol.deploy(await collateral.getAddress(), await loan.getAddress());
    console.log("LendingProtocol deployado en:", await protocol.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
