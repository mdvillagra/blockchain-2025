const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying tokens with address:", deployer.address);

  // Desplegar CollateralToken
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy("Mock Collateral", "COL", deployer.address);
  await collateralToken.waitForDeployment();
  console.log(`CollateralToken deployed at: ${collateralToken.target}`);

  // Desplegar LoanToken
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy("Mock Loan", "LOAN", deployer.address);
  await loanToken.waitForDeployment();
  console.log(`LoanToken deployed at: ${loanToken.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
