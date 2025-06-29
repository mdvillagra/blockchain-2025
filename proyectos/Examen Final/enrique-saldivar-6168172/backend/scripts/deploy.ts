import { ethers } from "hardhat";

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error(
      "❌ PRIVATE_KEY environment variable is required for Sepolia deployment."
    );
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "❌ No signers available. Please check your network configuration."
    );
  }

  const [deployer] = signers;
  const deployerAddress = await deployer.getAddress();

  console.log("🚀 Deploying contracts with the account:", deployerAddress);

  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error(
      "❌ Insufficient balance. Please add some Sepolia ETH to your account."
    );
  }

  // Deploy CollateralToken
  console.log("\nDeploying CollateralToken...");
  const CollateralTokenFactory = await ethers.getContractFactory(
    "CollateralToken"
  );
  const collateralToken = await CollateralTokenFactory.deploy();
  await collateralToken.waitForDeployment();
  const collateralTokenAddress = await collateralToken.getAddress();
  console.log("CollateralToken deployed to:", collateralTokenAddress);

  // Deploy LoanToken
  console.log("\nDeploying LoanToken...");
  const LoanTokenFactory = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanTokenFactory.deploy();
  await loanToken.waitForDeployment();
  const loanTokenAddress = await loanToken.getAddress();
  console.log("LoanToken deployed to:", loanTokenAddress);

  // Deploy LendingProtocol
  console.log("\nDeploying LendingProtocol...");
  const LendingProtocolFactory = await ethers.getContractFactory(
    "LendingProtocol"
  );
  const lendingProtocol = await LendingProtocolFactory.deploy(
    collateralTokenAddress,
    loanTokenAddress
  );
  await lendingProtocol.waitForDeployment();
  const lendingProtocolAddress = await lendingProtocol.getAddress();
  console.log("LendingProtocol deployed to:", lendingProtocolAddress);

  // Transfer some loan tokens to the protocol for lending
  console.log("\nTransferring loan tokens to protocol...");
  const transferAmount = ethers.parseEther("500000"); // 500,000 dDAI
  await loanToken.transfer(lendingProtocolAddress, transferAmount);
  console.log(
    `Transferred ${ethers.formatEther(transferAmount)} dDAI to protocol`
  );

  // Mint some tokens to deployer for testing
  console.log("\nMinting tokens for testing...");
  const mintAmount = ethers.parseEther("10000");
  await collateralToken.mint(deployerAddress, mintAmount);
  await loanToken.mint(deployerAddress, mintAmount);
  console.log(`Minted ${ethers.formatEther(mintAmount)} tokens to deployer`);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("CollateralToken (cUSD):", collateralTokenAddress);
  console.log("LoanToken (dDAI):", loanTokenAddress);
  console.log("LendingProtocol:", lendingProtocolAddress);

  console.log("\n=== ENVIRONMENT VARIABLES ===");
  console.log(`VITE_COLLATERAL_TOKEN_ADDRESS=${collateralTokenAddress}`);
  console.log(`VITE_LOAN_TOKEN_ADDRESS=${loanTokenAddress}`);
  console.log(`VITE_LENDING_PROTOCOL_ADDRESS=${lendingProtocolAddress}`);

  // Verify contracts on Etherscan (if deploying to testnet)
  if (process.env.NODE_ENV !== "test") {
    console.log("\nVerifying contracts on Etherscan...");
    console.log("Please run the following commands to verify:");
    console.log(
      `npx hardhat verify --network sepolia ${collateralTokenAddress}`
    );
    console.log(`npx hardhat verify --network sepolia ${loanTokenAddress}`);
    console.log(
      `npx hardhat verify --network sepolia ${lendingProtocolAddress} "${collateralTokenAddress}" "${loanTokenAddress}"`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
