// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying con:", deployer.address);

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const market = await Marketplace.deploy();
  await market.deployed();

  console.log("Marketplace desplegado en:", market.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
