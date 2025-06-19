import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Funding protocol with account:", deployer.address);

  // Read deployment addresses
  if (!fs.existsSync("./deployment-addresses.json")) {
    console.error(
      "Deployment addresses file not found. Please deploy contracts first."
    );
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync("./deployment-addresses.json", "utf8")
  );

  console.log("Loading contracts...");
  console.log("LoanToken address:", deploymentInfo.loanToken);
  console.log("LendingProtocol address:", deploymentInfo.lendingProtocol);

  // Get contracts
  const loanToken = await ethers.getContractAt(
    "LoanToken",
    deploymentInfo.loanToken
  );
  const lendingProtocol = await ethers.getContractAt(
    "LendingProtocol",
    deploymentInfo.lendingProtocol
  );

  // Get gas price with buffer
  const feeData = await ethers.provider.getFeeData();
  const baseGasPrice = feeData.gasPrice || ethers.parseUnits("10", "gwei");
  const safeGasPrice = baseGasPrice * 5n;

  console.log(
    "Base gas price:",
    ethers.formatUnits(baseGasPrice, "gwei"),
    "gwei"
  );
  console.log(
    "Safe gas price:",
    ethers.formatUnits(safeGasPrice, "gwei"),
    "gwei"
  );

  const fundAmount = ethers.parseEther("100000"); // 100k dDAI

  try {
    // Check current balances
    const deployerBalance = await loanToken.balanceOf(deployer.address);
    console.log("Deployer dDAI balance:", ethers.formatEther(deployerBalance));

    if (deployerBalance < fundAmount) {
      console.log("Insufficient dDAI balance, minting tokens...");
      const mintTx = await loanToken.mint(deployer.address, fundAmount, {
        gasPrice: safeGasPrice,
        gasLimit: 100000,
      });
      await mintTx.wait();
      console.log("Minted", ethers.formatEther(fundAmount), "dDAI");
    }

    // Approve tokens
    console.log("Approving tokens...");
    const approveTx = await loanToken.approve(
      deploymentInfo.lendingProtocol,
      fundAmount,
      {
        gasPrice: safeGasPrice,
        gasLimit: 100000,
      }
    );
    await approveTx.wait();
    console.log("Approval confirmed");

    // Fund the contract
    console.log("Funding contract...");
    const fundTx = await lendingProtocol.fundContract(fundAmount, {
      gasPrice: safeGasPrice,
      gasLimit: 200000,
    });
    await fundTx.wait();
    console.log("Protocol funded with", ethers.formatEther(fundAmount), "dDAI");

    // Verify funding
    const contractBalance = await loanToken.balanceOf(
      deploymentInfo.lendingProtocol
    );
    console.log("Contract dDAI balance:", ethers.formatEther(contractBalance));
  } catch (error: any) {
    if (error.message.includes("replacement transaction underpriced")) {
      console.log(
        "Gas price issue detected, retrying with higher gas price..."
      );

      const higherGasPrice = safeGasPrice * 2n;
      console.log(
        "Retrying with gas price:",
        ethers.formatUnits(higherGasPrice, "gwei"),
        "gwei"
      );

      try {
        const approveTx = await loanToken.approve(
          deploymentInfo.lendingProtocol,
          fundAmount,
          {
            gasPrice: higherGasPrice,
            gasLimit: 100000,
          }
        );
        await approveTx.wait();

        const fundTx = await lendingProtocol.fundContract(fundAmount, {
          gasPrice: higherGasPrice,
          gasLimit: 200000,
        });
        await fundTx.wait();
        console.log(
          "Protocol funded with",
          ethers.formatEther(fundAmount),
          "dDAI"
        );
      } catch (retryError) {
        console.error("Funding failed even with higher gas price:", retryError);
        process.exit(1);
      }
    } else {
      console.error("Funding failed:", error.message);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
