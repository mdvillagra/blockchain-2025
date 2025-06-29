const { ethers } = require("hardhat");

async function main() {
  // Obtener el signer (la cuenta que desplegará el contrato)
  const [deployer] = await ethers.getSigners();

  console.log("Desplegando contratos con la cuenta:", deployer.address);
  
  // Obtener el proveedor de la instancia de ethers o del signer
  const provider = ethers.provider; // O deployer.provider
  
  // Obtener el balance usando el proveedor
  const balanceBigInt = await provider.getBalance(deployer.address);
  console.log("Balance de la cuenta:", ethers.formatEther(balanceBigInt) + " ETH"); // Usar ethers.formatEther

  // Obtener la fábrica del contrato
  const MarketplaceFactory = await ethers.getContractFactory("Marketplace");

  // Desplegar el contrato
  console.log("Desplegando Marketplace...");
  const marketplace = await MarketplaceFactory.deploy();

  // Esperar a que el contrato sea desplegado y minado

  await marketplace.waitForDeployment();

  console.log("Contrato Marketplace desplegado en la dirección:", await marketplace.getAddress()); // Usar await marketplace.getAddress()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });