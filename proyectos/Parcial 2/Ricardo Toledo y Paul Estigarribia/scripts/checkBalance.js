const hre = require("hardhat");

async function main() {
  // Obtener el signer (cuenta)
  const [deployer] = await hre.ethers.getSigners();

  // Mostrar dirección
  console.log("Dirección del deployer:", deployer.address);

  // Obtener balance en wei
  const balanceWei = await deployer.provider.getBalance(deployer.address);

  // Convertir a ETH
  const balanceETH = hre.ethers.formatEther(balanceWei);

  // Mostrar balance
  console.log("Balance:", balanceETH, "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
