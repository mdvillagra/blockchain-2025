// scripts/deploy.js
async function main() {
  // Obtener el factory
  const Marketplace = await ethers.getContractFactory("Marketplace");
  // Desplegar
  const marketplace = await Marketplace.deploy();
  // Esperar a que termine el despliegue
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", marketplace.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
