const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const Marketplace = await hre.ethers.getContractFactory("MarketplaceNFT");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  console.log("MarketplaceNFT deployed to:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
