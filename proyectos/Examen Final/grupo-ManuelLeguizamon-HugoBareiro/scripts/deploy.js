const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Desplegar CollateralToken (cUSD)
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  await collateralToken.deployed();
  console.log("CollateralToken (cUSD) deployed to:", collateralToken.address);

  // 2. Desplegar LoanToken (dDAI)
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy();
  await loanToken.deployed();
  console.log("LoanToken (dDAI) deployed to:", loanToken.address); // <-- Agregué este log para ver la dirección

  // 3. Desplegar LendingProtocol
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralToken.address,
    loanToken.address
  );
  await lendingProtocol.deployed();
  console.log("LendingProtocol deployed to:", lendingProtocol.address);

  //  Crear tokens de prueba para poder interactuar con la DApp
  console.log("Minting some test tokens for the deployer...");
  // Crear 1000 cUSD para el deployer
  await collateralToken.mint(deployer.address, hre.ethers.utils.parseEther("1000"));

  // Añade una pequeña pausa aquí (ej. 3 segundos)
  console.log("Waiting 3 seconds before next mint transaction...");
  await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3000 milisegundos = 3 segundos

  // Crear 1000 dDAI y dárselos al contrato de préstamo para que los preste
  await loanToken.mint(lendingProtocol.address, hre.ethers.utils.parseEther("1000"))

  console.log("Minting complete!");
  console.log("\n--- DEPLOYMENT FINISHED ---");
  console.log("VITE_CONTRACT_ADDRESS=" + lendingProtocol.address); // <-- CORREGIDO: .getAddress() a .address
  console.log("--- COPY THE LINE ABOVE INTO YOUR .env FILE ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});