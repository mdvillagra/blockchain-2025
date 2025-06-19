const { ethers } = require("hardhat");
const fs = require("fs");

async function deployContracts() {
  const signer = (await ethers.getSigners())[0];
  console.log(`Iniciando despliegue con la cuenta: ${signer.address}`);

  let currentNonce = await ethers.provider.getTransactionCount(signer.address);
  let futureNonce = await ethers.provider.getTransactionCount(signer.address, "pending");

  console.log(`Nonce actual: ${currentNonce}`);
  console.log(`Nonce futuro: ${futureNonce}`);

  if (currentNonce !== futureNonce) {
    console.warn("⏳ Transacciones pendientes detectadas. Esperando 30 segundos...");
    await new Promise(res => setTimeout(res, 30000));
    currentNonce = await ethers.provider.getTransactionCount(signer.address);
    console.log(`Nonce actualizado: ${currentNonce}`);
  }

  const { gasPrice } = await ethers.provider.getFeeData();
  const adjustedGasPrice = gasPrice * 1.5n; // Aumentar gasPrice en 50% por seguridad
  console.log(`Gas price aplicado: ${ethers.formatUnits(adjustedGasPrice, "gwei")} gwei`);

  // Despliegue de contratos
  const deployments = {};

  console.log("📦 Desplegando contrato CollateralToken...");
  const CollateralTokenFactory = await ethers.getContractFactory("CollateralToken");
  const collateralInstance = await CollateralTokenFactory.deploy({
    gasPrice: adjustedGasPrice,
    nonce: currentNonce++
  });
  await collateralInstance.waitForDeployment();
  deployments.collateralToken = collateralInstance.target;
  console.log(`✅ CollateralToken desplegado en: ${collateralInstance.target}`);

  console.log("📦 Desplegando contrato LoanToken...");
  const LoanTokenFactory = await ethers.getContractFactory("LoanToken");
  const loanInstance = await LoanTokenFactory.deploy({
    gasPrice: adjustedGasPrice,
    nonce: currentNonce++
  });
  await loanInstance.waitForDeployment();
  deployments.loanToken = loanInstance.target;
  console.log(`✅ LoanToken desplegado en: ${loanInstance.target}`);

  console.log("📦 Desplegando contrato LendingProtocol...");
  const ProtocolFactory = await ethers.getContractFactory("LendingProtocol");
  const protocolInstance = await ProtocolFactory.deploy(
    collateralInstance.target,
    loanInstance.target,
    {
      gasPrice: adjustedGasPrice,
      nonce: currentNonce++
    }
  );
  await protocolInstance.waitForDeployment();
  deployments.lendingProtocol = protocolInstance.target;
  console.log(`✅ LendingProtocol desplegado en: ${protocolInstance.target}`);

  // Guardar en archivo
  fs.writeFileSync("deployed-addresses.json", JSON.stringify(deployments, null, 2));
  console.log("📝 Direcciones guardadas en deployed-addresses.json");
}

deployContracts().catch(err => {
  console.error("🚨 Error en el despliegue:", err);
  process.exit(1);
});
