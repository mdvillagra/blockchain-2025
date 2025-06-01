const hre = require("hardhat");

async function main() {
  console.log("Iniciando despliegue...");

  const Market = await hre.ethers.getContractFactory("Market");
  console.log("Contrato compilado correctamente");

  console.log("Desplegando contrato...");
  const market = await Market.deploy();

  console.log("Esperando confirmación...");
  await market.waitForDeployment();

  const contractAddress = await market.getAddress();
  console.log("Contrato desplegado en:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
