const hre = require("hardhat");

async function main() 
{
  const [deployer] = await hre.ethers.getSigners();

  // Desplegar CollateralToken con el owner
  const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy(deployer.address);
  await collateralToken.waitForDeployment();
  console.log("CollateralToken deployed to:", collateralToken.target);

  // Desplegar LoanToken con el owner
  const LoanToken = await hre.ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy(deployer.address);
  await loanToken.waitForDeployment();
  console.log("LoanToken deployed to:", loanToken.target);

  // Desplegar LendingProtocol con las direcciones de los tokens
  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralToken.target,
    loanToken.target
  );
  await lendingProtocol.waitForDeployment();
  console.log("LendingProtocol deployed to:", lendingProtocol.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});