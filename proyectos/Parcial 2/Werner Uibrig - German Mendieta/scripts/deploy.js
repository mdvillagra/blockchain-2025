const { ethers } = require("hardhat");

async function main() {
  // Obtiene la fábrica del contrato
  const Marketplace = await ethers.getContractFactory("Marketplace");

  // Despliega el contrato
  const marketplace = await Marketplace.deploy();
  // Espera a que el contrato esté desplegado
  await marketplace.waitForDeployment();

  // Obtiene la dirección del contrato desplegado
  const address = await marketplace.getAddress();
  console.log(`Marketplace deployed to: ${address}`);
}

// Manejo de errores
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});