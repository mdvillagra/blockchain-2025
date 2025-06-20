const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with address:", deployer.address);

  const collateralAddress = "0x3D2ca253f2e58e138Da432dc7aED1b77c2021143";
  const loanAddress = "0x13D1FAACde3477d5D6a20a6b466261b1Bd528da9";

  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lending = await LendingProtocol.deploy(collateralAddress, loanAddress);
  await lending.waitForDeployment();
  console.log(`LendingProtocol deployed at: ${lending.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

