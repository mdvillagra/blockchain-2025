const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment de contratos...");
  console.log("=====================================");

  // Obtener el signer
  const [deployer] = await ethers.getSigners();
  console.log("🔐 Deployando contratos con la cuenta:", deployer.address);

  // Verificar balance del deployer
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Advertencia: Balance bajo, puede que no sea suficiente para el deployment");
  }

  console.log("\n");

  try {
    // 1. Desplegar CollateralToken (cUSD)
    console.log("📦 1. Deployando CollateralToken (cUSD)...");
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const collateralToken = await CollateralToken.deploy();
    await collateralToken.waitForDeployment();
    console.log("✅ CollateralToken desplegado en:", await collateralToken.getAddress());

    // 2. Desplegar LoanToken (dDAI)  
    console.log("📦 2. Deployando LoanToken (dDAI)...");
    const LoanToken = await ethers.getContractFactory("LoanToken");
    const loanToken = await LoanToken.deploy();
    await loanToken.waitForDeployment();
    console.log("✅ LoanToken desplegado en:", await loanToken.getAddress());

    // 3. Desplegar LendingProtocol
    console.log("📦 3. Deployando LendingProtocol...");
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    const lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress()
    );
    await lendingProtocol.waitForDeployment();
    console.log("✅ LendingProtocol desplegado en:", await lendingProtocol.getAddress());

    console.log("\n");
    console.log("🎉 ¡Deployment completado exitosamente!");
    console.log("=====================================");

    // Mostrar resumen de direcciones
    console.log("📋 RESUMEN DE CONTRATOS DESPLEGADOS:");
    console.log("=====================================");
    console.log("🪙 CollateralToken (cUSD):", await collateralToken.getAddress());
    console.log("🪙 LoanToken (dDAI):", await loanToken.getAddress());
    console.log("🏦 LendingProtocol:", await lendingProtocol.getAddress());

    // Configuración inicial de tokens
    console.log("\n");
    console.log("⚙️  Configurando tokens iniciales...");
    
    // Mint tokens iniciales para el deployer (para testing)
    const initialMint = ethers.parseEther("10000"); // 10,000 tokens cada uno
    
    console.log("🪙 Minteando tokens iniciales para testing...");
    await collateralToken.mint(deployer.address, initialMint);
    console.log("✅ Minteados 10,000 cUSD para el deployer");
    
    await loanToken.mint(deployer.address, initialMint);
    console.log("✅ Minteados 10,000 dDAI para el deployer");

    // Verificar balances después del mint
    const deployerCUSDBalance = await collateralToken.balanceOf(deployer.address);
    const deployerDDAIBalance = await loanToken.balanceOf(deployer.address);
    console.log("💰 Balance cUSD del deployer:", ethers.formatEther(deployerCUSDBalance));
    console.log("💰 Balance dDAI del deployer:", ethers.formatEther(deployerDDAIBalance));

    // Configurar liquidez inicial con mejor manejo de errores
    const initialLiquidity = ethers.parseEther("5000"); // 5,000 dDAI
    console.log("\n💧 Proporcionando liquidez inicial al protocolo...");
    
    try {
      // Verificar balance antes de aprobar
      console.log("🔍 Verificando balance antes de aprobar...");
      const balanceBefore = await loanToken.balanceOf(deployer.address);
      console.log("   Balance disponible:", ethers.formatEther(balanceBefore), "dDAI");
      
      if (balanceBefore < initialLiquidity) {
        console.log("⚠️  No hay suficientes tokens para liquidez inicial");
        throw new Error("Insufficient tokens for liquidity");
      }

      // Aprobar con verificación
      console.log("✍️  Aprobando gasto de", ethers.formatEther(initialLiquidity), "dDAI...");
      const approvalTx = await loanToken.approve(await lendingProtocol.getAddress(), initialLiquidity);
      console.log("   Tx de aprobación:", approvalTx.hash);
      await approvalTx.wait();
      console.log("✅ Aprobación confirmada");

      // Verificar allowance
      const allowance = await loanToken.allowance(deployer.address, await lendingProtocol.getAddress());
      console.log("🔍 Allowance verificado:", ethers.formatEther(allowance), "dDAI");
      
      if (allowance < initialLiquidity) {
        console.log("❌ Allowance insuficiente");
        throw new Error("Insufficient allowance");
      }

      // Depositar liquidez
      console.log("💧 Depositando liquidez...");
      const depositTx = await lendingProtocol.depositLiquidity(initialLiquidity);
      console.log("   Tx de depósito:", depositTx.hash);
      await depositTx.wait();
      console.log("✅ Depositados", ethers.formatEther(initialLiquidity), "dDAI como liquidez inicial");

    } catch (liquidityError) {
      console.log("⚠️  Error configurando liquidez inicial:", liquidityError.message);
      console.log("⚠️  Los contratos están desplegados pero sin liquidez inicial");
      console.log("⚠️  Puedes agregar liquidez manualmente después");
    }

    console.log("\n");
    console.log("🌐 INFORMACIÓN PARA VARIABLES DE ENTORNO:");
    console.log("========================================");
    console.log(`VITE_CONTRACT_ADDRESS=${await lendingProtocol.getAddress()}`);
    console.log(`VITE_COLLATERAL_TOKEN_ADDRESS=${await collateralToken.getAddress()}`);
    console.log(`VITE_LOAN_TOKEN_ADDRESS=${await loanToken.getAddress()}`);
    console.log(`VITE_RPC_URL=https://otter.bordel.wtf/erigon`);

    console.log("\n");
    console.log("📝 INSTRUCCIONES POST-DEPLOYMENT:");
    console.log("==================================");
    console.log("1. Copia las variables de entorno de arriba a tu archivo .env");
    console.log("2. Para obtener tokens de prueba, llama a las funciones mint() de los contratos");
    console.log("3. Verifica los contratos en el explorador de Ephemery");
    console.log("4. Ejecuta la aplicación web con: cd web_app && npm run dev");

    // Verificar que todo está configurado correctamente
    console.log("\n");
    console.log("🔍 Verificando configuración final...");
    
    const protocolCollateralToken = await lendingProtocol.collateralToken();
    const protocolLoanToken = await lendingProtocol.loanToken();
    const protocolLiquidity = await loanToken.balanceOf(await lendingProtocol.getAddress());
    
    console.log("✅ Protocolo configurado correctamente:");
    console.log("   - Collateral Token:", protocolCollateralToken === await collateralToken.getAddress() ? "✅" : "❌");
    console.log("   - Loan Token:", protocolLoanToken === await loanToken.getAddress() ? "✅" : "❌");
    console.log("   - Liquidez disponible:", ethers.formatEther(protocolLiquidity), "dDAI");

    console.log("\n");
    console.log("🎊 ¡Deployment y configuración completados!");
    console.log("El protocolo está listo para usar en Ephemery Testnet");

    // Si no hay liquidez, dar instrucciones para agregarla manualmente
    if (protocolLiquidity === 0n) {
      console.log("\n");
      console.log("⚠️  NOTA: Sin liquidez inicial detectada");
      console.log("📝 Para agregar liquidez manualmente:");
      console.log("   1. Ejecuta: npx hardhat console --network ephemery");
      console.log("   2. Luego ejecuta estos comandos:");
      console.log(`   const loanToken = await ethers.getContractAt("LoanToken", "${await loanToken.getAddress()}");`);
      console.log(`   const lending = await ethers.getContractAt("LendingProtocol", "${await lendingProtocol.getAddress()}");`);
      console.log(`   await loanToken.approve("${await lendingProtocol.getAddress()}", ethers.parseEther("5000"));`);
      console.log(`   await lending.depositLiquidity(ethers.parseEther("5000"));`);
    }

  } catch (error) {
    console.error("❌ Error durante el deployment:", error);
    process.exit(1);
  }
}

// Manejo de errores
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error crítico:", error);
    process.exit(1);
  }); 