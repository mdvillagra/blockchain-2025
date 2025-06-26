const { ethers } = require("hardhat");

async function main() {
  // Obtiene la cuenta que desplegará los contratos
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Despliega el token de colateral (cUSD)
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const cUSD = await CollateralToken.deploy();
  console.log("CollateralToken deployed at:", cUSD.target);

  // Despliega el token de préstamo (dDAI)
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const dDAI = await LoanToken.deploy();
  console.log("LoanToken deployed at:", dDAI.target);

  // Despliega el contrato principal del protocolo de préstamos, pasando las direcciones de los tokens
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(cUSD.target, dDAI.target);
  console.log("LendingProtocol deployed at:", lendingProtocol.target);

  // Transfiere la propiedad de ambos tokens al contrato del protocolo para que pueda controlar mint/burn
  await cUSD.transferOwnership(lendingProtocol.target);
  await dDAI.transferOwnership(lendingProtocol.target);
  console.log("Ownership transferred to protocol");

  console.log("\nDEPLOYMENT COMPLETE:");
  console.log({
    CollateralToken: cUSD.target,
    LoanToken: dDAI.target,
    LendingProtocol: lendingProtocol.target
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});