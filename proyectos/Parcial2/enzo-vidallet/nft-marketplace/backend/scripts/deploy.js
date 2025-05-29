const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Versión actualizada para ethers.js v6+
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy();
  
  console.log("Waiting for deployment...");
  await nftMarketplace.waitForDeployment();

  console.log("NFTMarketplace address:", await nftMarketplace.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });