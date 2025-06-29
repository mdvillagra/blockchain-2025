import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Account:", deployer.address);

  // Get current nonce (next transaction number)
  const currentNonce = await ethers.provider.getTransactionCount(
    deployer.address
  );
  console.log("Current nonce:", currentNonce);

  // Get pending nonce (including mempool transactions)
  const pendingNonce = await ethers.provider.getTransactionCount(
    deployer.address,
    "pending"
  );
  console.log("Pending nonce:", pendingNonce);

  if (currentNonce !== pendingNonce) {
    console.log("WARNING: There are pending transactions!");
    console.log("Pending transactions:", pendingNonce - currentNonce);
  } else {
    console.log("No pending transactions.");
  }

  // Get current balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  console.log(
    "Current gas price:",
    ethers.formatUnits(feeData.gasPrice || 0n, "gwei"),
    "gwei"
  );

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(
    "Network:",
    network.name,
    "Chain ID:",
    network.chainId.toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
