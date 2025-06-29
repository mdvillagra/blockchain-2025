import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // Get initial nonce to avoid conflicts
  const initialNonce = await ethers.provider.getTransactionCount(
    deployer.address
  );
  console.log("Starting nonce:", initialNonce);

  // Get gas price with a significant buffer for Ephemery testnet
  const feeData = await ethers.provider.getFeeData();
  const baseGasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");
  const safegasPrice = baseGasPrice * 5n; // 5x multiplier for safety

  console.log(
    "Base gas price:",
    ethers.formatUnits(baseGasPrice, "gwei"),
    "gwei"
  );
  console.log(
    "Safe gas price:",
    ethers.formatUnits(safegasPrice, "gwei"),
    "gwei"
  );

  const deployOptions = {
    gasPrice: safegasPrice,
    gasLimit: 2000000,
  };

  // Deploy CollateralToken (cUSD)
  console.log("\nDeploying CollateralToken...");
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy(deployer.address, {
    ...deployOptions,
    nonce: initialNonce,
  });
  await collateralToken.waitForDeployment();
  const collateralAddress = await collateralToken.getAddress();
  console.log("CollateralToken deployed to:", collateralAddress);

  // Deploy LoanToken (dDAI)
  console.log("\nDeploying LoanToken...");
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy(deployer.address, {
    ...deployOptions,
    nonce: initialNonce + 1,
  });
  await loanToken.waitForDeployment();
  const loanAddress = await loanToken.getAddress();
  console.log("LoanToken deployed to:", loanAddress);

  // Deploy LendingProtocol
  console.log("\nDeploying LendingProtocol...");
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralAddress,
    loanAddress,
    deployer.address,
    {
      ...deployOptions,
      nonce: initialNonce + 2,
    }
  );
  await lendingProtocol.waitForDeployment();
  const protocolAddress = await lendingProtocol.getAddress();
  console.log("LendingProtocol deployed to:", protocolAddress);

  // Fund the protocol with loan tokens for testing
  console.log("\nFunding protocol with loan tokens...");
  const fundAmount = ethers.parseEther("100000"); // 100k dDAI

  // Wait a bit to ensure previous transactions are confirmed
  console.log("Waiting for previous transactions to confirm...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    // Approve tokens first
    console.log("Approving tokens...");
    const approveOptions = {
      gasPrice: safegasPrice,
      gasLimit: 100000,
    };

    const approveTx = await loanToken.approve(
      protocolAddress,
      fundAmount,
      approveOptions
    );
    await approveTx.wait();
    console.log("Approval confirmed");

    // Fund the contract
    console.log("Funding contract...");
    const fundOptions = {
      gasPrice: safegasPrice,
      gasLimit: 200000,
    };

    const fundTx = await lendingProtocol.fundContract(fundAmount, fundOptions);
    await fundTx.wait();
    console.log("Protocol funded with", ethers.formatEther(fundAmount), "dDAI");
  } catch (error: any) {
    if (error.message.includes("replacement transaction underpriced")) {
      console.log(
        "Gas price issue detected, retrying with higher gas price..."
      );

      // Try again with even higher gas price
      const higherGasPrice = safegasPrice * 2n;
      console.log(
        "Retrying with gas price:",
        ethers.formatUnits(higherGasPrice, "gwei"),
        "gwei"
      );

      const retryOptions = {
        gasPrice: higherGasPrice,
        gasLimit: 200000,
      };

      try {
        const approveTx = await loanToken.approve(
          protocolAddress,
          fundAmount,
          retryOptions
        );
        await approveTx.wait();

        const fundTx = await lendingProtocol.fundContract(
          fundAmount,
          retryOptions
        );
        await fundTx.wait();
        console.log(
          "Protocol funded with",
          ethers.formatEther(fundAmount),
          "dDAI"
        );
      } catch (retryError) {
        console.log(
          "Funding failed, but contracts are deployed. You can fund manually later."
        );
        console.log("Retry error:", retryError);
      }
    } else {
      console.log(
        "Funding failed, but contracts are deployed. You can fund manually later."
      );
      console.log("Error:", error.message);
    }
  }

  // Log deployment summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("CollateralToken (cUSD):", collateralAddress);
  console.log("LoanToken (dDAI):", loanAddress);
  console.log("LendingProtocol:", protocolAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);

  // Save addresses to file for frontend
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    collateralToken: collateralAddress,
    loanToken: loanAddress,
    lendingProtocol: protocolAddress,
    deployer: deployer.address,
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployment-addresses.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment addresses saved to deployment-addresses.json");

  // Additional instructions for manual funding if needed
  console.log("\n=== MANUAL FUNDING INSTRUCTIONS ===");
  console.log("If funding failed, you can fund the contract manually:");
  console.log("1. Get dDAI tokens by calling loanToken.mint()");
  console.log(
    "2. Approve the protocol: loanToken.approve(protocolAddress, amount)"
  );
  console.log("3. Fund the protocol: lendingProtocol.fundContract(amount)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
