const hre = require("hardhat");

async function main() 
{
  const [deployer] = await hre.ethers.getSigners();

  // Desplegar CollateralToken con el owner
  const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  console.log("CollateralToken deployed to:", collateralToken.address);

  // Desplegar LoanToken con el owner
  const LoanToken = await hre.ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy();
  console.log("LoanToken deployed to:", loanToken.address);

  // Desplegar LendingProtocol con las direcciones de los tokens
  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralToken.address,
    loanToken.address
  );
  console.log("LendingProtocol deployed to:", lendingProtocol.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});