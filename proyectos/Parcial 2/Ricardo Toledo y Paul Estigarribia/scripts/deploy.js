const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Usando la cuenta:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Saldo disponible:", hre.ethers.formatEther(balance), "ETH");

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();

  // Espera explícitamente que el contrato se mine
  await marketplace.waitForDeployment();

  // Aquí sí imprimimos la dirección correcta
console.log("Contrato desplegado en:", await marketplace.getAddress());

const fs   = require("fs");
const path = require("path");

const deployedAddress = await marketplace.getAddress();

// 1) Guardar en scripts/contract-address.json
const scriptsAddressFile = path.resolve(__dirname, "contract-address.json");
fs.writeFileSync(
  scriptsAddressFile,
  JSON.stringify({ contractAddress: deployedAddress }, null, 2)
);
console.log("✅ Dirección guardada en", scriptsAddressFile);

// 2) Guardar también en tu React src/
const frontendAddressFile = path.resolve(__dirname, "../web_app/src/contract-address.json");
fs.writeFileSync(
  frontendAddressFile,
  JSON.stringify({ contractAddress: deployedAddress }, null, 2)
);
console.log("✅ Dirección guardada en", frontendAddressFile);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
