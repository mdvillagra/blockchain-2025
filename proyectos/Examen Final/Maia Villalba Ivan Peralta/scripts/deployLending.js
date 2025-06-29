const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const collateralAddress = process.env.VITE_COLLATERAL_TOKEN_ADDRESS;
  const loanAddress = process.env.VITE_LOAN_TOKEN_ADDRESS;

  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lending = await LendingProtocol.deploy(collateralAddress, loanAddress);
  await lending.waitForDeployment();

  console.log(`LendingProtocol deployed at: ${await lending.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
