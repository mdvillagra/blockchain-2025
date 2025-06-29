/* scripts/mint.js - DESPUÉS */

const { ethers } = require("hardhat");
// 1. Importa el archivo JSON. La ruta es diferente porque estamos en la carpeta 'scripts'
const contractAddresses = require("../web_app/src/deployment-addresses.json");

async function main() {
  // 2. Usa la dirección del objeto importado
  const collateralTokenAddress = contractAddresses.collateralTokenAddress; // <-- Lee del JSON
  const receiverAddress = "0xTU_DIRECCION_DE_METAMASK"; // Cambiar al la direccion deseada
  const amountToMint = ethers.parseUnits("1000", 18);
  
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = CollateralToken.attach(collateralTokenAddress);

  // ... resto del script
  const signer = await ethers.provider.getSigner();
  const signerAddress = await signer.getAddress();
  console.log(`Usando la cuenta del firmante (${signerAddress}) para acuñar tokens...`);

  console.log(`Acuñando ${ethers.formatUnits(amountToMint)} cUSD para la dirección ${receiverAddress}...`);

  const tx = await collateralToken.mint(receiverAddress, amountToMint);
  console.log("Transacción enviada, hash:", tx.hash);

  await tx.wait();
  console.log("¡Transacción confirmada!");
  
  const balance = await collateralToken.balanceOf(receiverAddress);
  console.log(`Nuevo saldo de cUSD de ${receiverAddress}: ${ethers.formatUnits(balance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});