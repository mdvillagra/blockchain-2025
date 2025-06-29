// Deploys CollateralAsset, BorrowableAsset, and DeFiLending contracts
// Automatically writes deployment‐addresses.json with the deployed addresses

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=== Deployment Started ===");
  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    `${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );

  // Prepare gas settings
  const feeData = await ethers.provider.getFeeData();
  const baseGasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");
  const safeGasPrice = baseGasPrice * 3n;
  const deployOptions = {
    gasPrice: safeGasPrice,
    gasLimit: 2_000_000,
  };

  // Deploy CollateralAsset (cUSD)
  console.log("\n>> Deploying CollateralAsset...");
  const CollateralFactory = await ethers.getContractFactory("CollateralAsset");
  const collateralAsset = await CollateralFactory.deploy(deployOptions);
  await collateralAsset.waitForDeployment();
  const collateralAddress = await collateralAsset.getAddress();
  console.log("cUSD deployed to:", collateralAddress);

  // Deploy BorrowableAsset (dDAI)
  console.log("\n>> Deploying BorrowableAsset...");
  const BorrowableFactory = await ethers.getContractFactory("BorrowableAsset");
  const borrowableAsset = await BorrowableFactory.deploy(deployOptions);
  await borrowableAsset.waitForDeployment();
  const loanAddress = await borrowableAsset.getAddress();
  console.log("dDAI deployed to:", loanAddress);

  // Deploy DeFiLending protocol
  console.log("\n>> Deploying DeFiLending...");
  const ProtocolFactory = await ethers.getContractFactory("DeFiLending");
  const defiLending = await ProtocolFactory.deploy(
    collateralAddress,
    loanAddress,
    deployOptions
  );
  await defiLending.waitForDeployment();
  const protocolAddress = await defiLending.getAddress();
  console.log("Protocol deployed to:", protocolAddress);

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    chain: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      collateralAsset: collateralAddress,
      borrowableAsset: loanAddress,
      deFiLending: protocolAddress,
    },
  };

  const outPath = path.resolve(__dirname, "../deployment-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✅ Deployment info saved to ${outPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
