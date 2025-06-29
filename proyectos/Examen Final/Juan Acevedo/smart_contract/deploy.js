const { ethers } = require("hardhat");

async function main() {
  console.log("Desplegando contratos...");

  // Obtener el signer
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  // Desplegar CollateralToken
  console.log("\nDesplegando CollateralToken...");
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy(deployer.address);
  await collateralToken.waitForDeployment();
  const collateralTokenAddress = await collateralToken.getAddress();
  console.log("CollateralToken desplegado en:", collateralTokenAddress);

  // Desplegar LoanToken
  console.log("\nDesplegando LoanToken...");
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy(deployer.address);
  await loanToken.waitForDeployment();
  const loanTokenAddress = await loanToken.getAddress();
  console.log("LoanToken desplegado en:", loanTokenAddress);

  // Desplegar LendingProtocol
  console.log("\nDesplegando LendingProtocol...");
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralTokenAddress,
    loanTokenAddress,
    deployer.address
  );
  await lendingProtocol.waitForDeployment();
  const lendingProtocolAddress = await lendingProtocol.getAddress();
  console.log("LendingProtocol desplegado en:", lendingProtocolAddress);

  // Direcciones para .env
  console.log("\nDirecciones para .env del frontend:");
  console.log(`VITE_LENDING_PROTOCOL_ADDRESS=${lendingProtocolAddress}`);
  console.log(`VITE_COLLATERAL_TOKEN_ADDRESS=${collateralTokenAddress}`);
  console.log(`VITE_LOAN_TOKEN_ADDRESS=${loanTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el despliegue:", error);
    process.exit(1);
  });