const hre = require("hardhat");

async function main() {
  // Obtenemos el contrato a desplegar
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  
  // Esperamos a que el contrato sea desplegado
  await marketplace.deployed();
  
  console.log("Marketplace desplegado en:", marketplace.address);
  
  // Devolvemos la dirección para usarla en otros scripts
  return marketplace.address;
}

// Ejecutamos el despliegue
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });