const hre = require("hardhat");

async function main() {
  console.log("Deploying Marketplace contract...");

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();

  // Wait for deployment - new syntax for ethers v6
  await marketplace.waitForDeployment();
  
  // Get the address - new syntax for ethers v6
  const address = await marketplace.getAddress();

  console.log("Marketplace deployed to:", address);

  // Mint initial batch of 10 NFTs
  console.log("Minting initial batch of NFTs...");
  const tx = await marketplace.mintInitialBatch();
  await tx.wait();
  console.log("Initial batch minted successfully!");

  // Save the contract address for the frontend
  const fs = require("fs");
  const contractsDir = __dirname + "/../web_app/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Get the contract ABI
  const artifact = await hre.artifacts.readArtifact("Marketplace");

  fs.writeFileSync(
    contractsDir + "/Marketplace.json",
    JSON.stringify({
      address: address,
      abi: artifact.abi
    }, null, 2)
  );

  console.log("Contract address and ABI saved to web_app/src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });