// Utility script: shows deployer's account details, nonce, balance, and network

import { ethers } from "hardhat";

async function main() {
  const [account] = await ethers.getSigners();

  console.log("=== Account Information ===");
  console.log("Address:", account.address);

  // Nonce: confirmed vs pending
  const confirmedNonce = await ethers.provider.getTransactionCount(
    account.address
  );
  const pendingNonce = await ethers.provider.getTransactionCount(
    account.address,
    "pending"
  );
  console.log("Confirmed nonce:", confirmedNonce);
  console.log("Pending nonce:", pendingNonce);
  if (confirmedNonce !== pendingNonce) {
    console.warn(
      `Transactions pending: ${pendingNonce - confirmedNonce}`
    );
  }

  // ETH balance
  const balanceWei = await ethers.provider.getBalance(account.address);
  console.log(
    "Balance:",
    `${ethers.formatEther(balanceWei)} ETH`
  );

  // Gas price and network
  const feeData = await ethers.provider.getFeeData();
  console.log(
    "Gas price:",
    `${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`
  );

  const network = await ethers.provider.getNetwork();
  console.log(
    "Network:",
    `${network.name} (chainId: ${network.chainId})`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
