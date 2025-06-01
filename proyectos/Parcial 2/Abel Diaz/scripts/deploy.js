const { ethers } = require("hardhat");

async function main() {
  // 1. Desplegar el contrato
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  const contractAddress = await marketplace.getAddress();
  console.log("Deployed to:", contractAddress);

  // 2. Aprobar el marketplace para gestionar sus propios NFTs
  console.log("Approving marketplace to manage its NFTs...");
  const approveTx = await marketplace.approveMarketplace();
  await approveTx.wait(); // Esperar a que se mine la transacción
  console.log("Marketplace approved successfully!");
}

main().catch(console.error);