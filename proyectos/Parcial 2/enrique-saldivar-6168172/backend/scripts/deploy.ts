import { ethers } from "hardhat";

async function main() {
  console.log("Desplegando contrato Marketplace...");

  // Obtenemos la cuenta del deployer
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  // Obtenemos balance inicial
  const balanceAntes = await ethers.provider.getBalance(deployer.address);
  console.log(
    "Balance antes del despliegue:",
    ethers.formatEther(balanceAntes),
    "ETH"
  );
  // Desplegamos el contrato
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(deployer.address);

  // En ethers v6 ya no existe el método deployed(), esperamos por la transacción de despliegue
  await marketplace.waitForDeployment();

  // Obtenemos balance después del despliegue
  const balanceDespues = await ethers.provider.getBalance(deployer.address);
  const gastoGas = balanceAntes - balanceDespues;
  // En ethers v6 se usa getAddress() en lugar de acceder directamente a .address
  console.log("Marketplace desplegado en:", await marketplace.getAddress());
  console.log(
    "Gas usado para el despliegue:",
    ethers.formatEther(gastoGas),
    "ETH"
  );
  console.log(
    "Balance después del despliegue:",
    ethers.formatEther(balanceDespues),
    "ETH"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
