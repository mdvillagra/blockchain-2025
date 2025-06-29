const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Lending Protocol...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // 1. Deploy Collateral Token (cUSD)
  console.log("\n📄 Deploying Collateral Token (cUSD)...");
  const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  await collateralToken.waitForDeployment();
  const collateralAddress = await collateralToken.getAddress();
  console.log("✅ CollateralToken (cUSD) deployed to:", collateralAddress);

  // 2. Deploy Loan Token (dDAI)
  console.log("\n📄 Deploying Loan Token (dDAI)...");
  const LoanToken = await hre.ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy();
  await loanToken.waitForDeployment();
  const loanAddress = await loanToken.getAddress();
  console.log("✅ LoanToken (dDAI) deployed to:", loanAddress);

  // 3. Deploy Lending Protocol
  console.log("\n📄 Deploying Lending Protocol...");
  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(collateralAddress, loanAddress);
  await lendingProtocol.waitForDeployment();
  const lendingAddress = await lendingProtocol.getAddress();
  console.log("✅ LendingProtocol deployed to:", lendingAddress);

  // 4. Setup initial funding
  console.log("\n💰 Setting up initial funding...");
  
  // Fund the lending protocol with dDAI for loans
  const fundAmount = hre.ethers.parseEther("500000"); // 500k dDAI
  await loanToken.approve(lendingAddress, fundAmount);
  await lendingProtocol.fundContract(fundAmount);
  console.log(`✅ Funded contract with ${hre.ethers.formatEther(fundAmount)} dDAI`);
  
  // Mint some tokens to deployer for testing
  const testAmount = hre.ethers.parseEther("10000");
  await collateralToken.mint(deployer.address, testAmount);
  await loanToken.mint(deployer.address, testAmount);
  console.log(`✅ Minted ${hre.ethers.formatEther(testAmount)} tokens for testing`);

  // 5. Summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   CollateralToken (cUSD):", collateralAddress);
  console.log("   LoanToken (dDAI):", loanAddress);
  console.log("   LendingProtocol:", lendingAddress);
  
  console.log("\n🔧 Configuration:");
  console.log("   Collateral Ratio: 150%");
  console.log("   Weekly Interest Rate: 5%");
  console.log("   Contract dDAI Balance:", hre.ethers.formatEther(await lendingProtocol.getContractBalance()));
  
  // Export addresses for frontend
  console.log("\n📄 Environment Variables:");
  console.log(`VITE_COLLATERAL_TOKEN_ADDRESS=${collateralAddress}`);
  console.log(`VITE_LOAN_TOKEN_ADDRESS=${loanAddress}`);
  console.log(`VITE_LENDING_PROTOCOL_ADDRESS=${lendingAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
