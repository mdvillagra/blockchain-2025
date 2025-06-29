const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Script para mintear tokens de prueba");
  console.log("=====================================");

  // Direcciones de contratos (deben estar desplegados)
  const COLLATERAL_TOKEN_ADDRESS = process.env.VITE_COLLATERAL_TOKEN_ADDRESS;
  const LOAN_TOKEN_ADDRESS = process.env.VITE_LOAN_TOKEN_ADDRESS;
  
  if (!COLLATERAL_TOKEN_ADDRESS || !LOAN_TOKEN_ADDRESS) {
    console.error("❌ Error: Define las direcciones de contratos en .env");
    console.log("VITE_COLLATERAL_TOKEN_ADDRESS=...");
    console.log("VITE_LOAN_TOKEN_ADDRESS=...");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("🔐 Minteando tokens con la cuenta:", deployer.address);

  try {
    // Conectar a los contratos
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const LoanToken = await ethers.getContractFactory("LoanToken");
    
    const collateralToken = CollateralToken.attach(COLLATERAL_TOKEN_ADDRESS);
    const loanToken = LoanToken.attach(LOAN_TOKEN_ADDRESS);

    // Cantidad a mintear (1000 tokens cada uno)
    const mintAmount = ethers.parseEther("1000");

    console.log("🪙 Minteando 1000 cUSD...");
    await collateralToken.mint(deployer.address, mintAmount);
    console.log("✅ cUSD minteados exitosamente");

    console.log("🪙 Minteando 1000 dDAI...");
    await loanToken.mint(deployer.address, mintAmount);
    console.log("✅ dDAI minteados exitosamente");

    // Verificar balances
    const cUSDBalance = await collateralToken.balanceOf(deployer.address);
    const dDAIBalance = await loanToken.balanceOf(deployer.address);

    console.log("\n📊 Balances actualizados:");
    console.log("========================");
    console.log("cUSD:", ethers.formatEther(cUSDBalance));
    console.log("dDAI:", ethers.formatEther(dDAIBalance));

    console.log("\n🎉 ¡Tokens minteados exitosamente!");
    console.log("Ya puedes usar la DApp para depositar colateral y pedir préstamos.");

  } catch (error) {
    console.error("❌ Error minteando tokens:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error crítico:", error);
    process.exit(1);
  }); 