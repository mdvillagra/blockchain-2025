const { ethers } = require("hardhat");

async function main() {
  // Obtener el contrato
  const Marketplace = await ethers.getContractFactory("Marketplace");
  
  // Desplegar el contrato
  console.log("Desplegando Marketplace...");
  const marketplace = await Marketplace.deploy();
  
  // Esperar a que se complete el despliegue
  await marketplace.waitForDeployment();
  
  // Obtener la dirección del contrato desplegado
  const contractAddress = await marketplace.getAddress();
  
  // Mostrar la dirección del contrato
  console.log("Marketplace desplegado en:", contractAddress);
}

// Ejecutar la función de despliegue
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
