const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy CollateralToken (cUSD)
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy(
    "Collateral USD",
    "cUSD",
    18,
    ethers.parseEther("1000000") // 1M initial supply
  );
  await collateralToken.waitForDeployment();

  console.log("CollateralToken deployed to:", await collateralToken.getAddress());

  // Deploy LoanToken (dDAI)
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy(
    "Decentralized DAI",
    "dDAI",
    18,
    ethers.parseEther("1000000") // 1M initial supply
  );
  await loanToken.waitForDeployment();

  console.log("LoanToken deployed to:", await loanToken.getAddress());

  // Deploy LendingProtocol
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    await collateralToken.getAddress(),
    await loanToken.getAddress()
  );
  await lendingProtocol.waitForDeployment();

  console.log("LendingProtocol deployed to:", await lendingProtocol.getAddress());

  // Transfer some tokens to the lending protocol for liquidity
  const liquidityAmount = ethers.parseEther("500000"); // 500K tokens
  await loanToken.transfer(await lendingProtocol.getAddress(), liquidityAmount);

  console.log("Transferred", ethers.formatEther(liquidityAmount), "dDAI to LendingProtocol for liquidity");

  // Mint some tokens to deployer for testing
  const testAmount = ethers.parseEther("10000"); // 10K tokens
  await collateralToken.mint(deployer.address, testAmount);
  await loanToken.mint(deployer.address, testAmount);

  console.log("Minted", ethers.formatEther(testAmount), "tokens to deployer for testing");

  console.log("\n=== Deployment Summary ===");
  console.log("CollateralToken (cUSD):", await collateralToken.getAddress());
  console.log("LoanToken (dDAI):", await loanToken.getAddress());
  console.log("LendingProtocol:", await lendingProtocol.getAddress());
  
  console.log("\n=== Add these addresses to your .env file ===");
  console.log(`VITE_COLLATERAL_TOKEN_ADDRESS=${await collateralToken.getAddress()}`);
  console.log(`VITE_LOAN_TOKEN_ADDRESS=${await loanToken.getAddress()}`);
  console.log(`VITE_LENDING_PROTOCOL_ADDRESS=${await lendingProtocol.getAddress()}`);

  // Write contract addresses to web_app/.env
  const envPath = path.join(__dirname, '..', 'web_app', '.env');
  const envContent = 
    `VITE_COLLATERAL_TOKEN_ADDRESS=${await collateralToken.getAddress()}\n` +
    `VITE_LOAN_TOKEN_ADDRESS=${await loanToken.getAddress()}\n` +
    `VITE_LENDING_PROTOCOL_ADDRESS=${await lendingProtocol.getAddress()}\n`;

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Wrote contract addresses to web_app/.env`);

  // Copy ABI files to frontend after deployment
  function copyABI(contractName) {
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
    const destPath = path.join(__dirname, '..', 'web_app', 'src', 'contracts', `${contractName}.json`);
    fs.copyFileSync(artifactPath, destPath);
    console.log(`✅ Copied ABI for ${contractName} to web_app/src/contracts/`);
  }

  copyABI('LendingProtocol');
  copyABI('CollateralToken');
  copyABI('LoanToken');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });