// scripts/deploy.js

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs"); // <<< 1. AÑADIDO: Importamos el módulo para manejar archivos

async function main() {
  // 1) Obtener la cuenta que firma el deploy
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con cuenta:", deployer.address);

  // 2) Desplegar CollateralToken
  const Collateral = await ethers.getContractFactory("CollateralToken");
  const collateral = await Collateral.deploy();
  await collateral.waitForDeployment();
  console.log("CollateralToken desplegado en:", collateral.target);

  // 3) Desplegar LoanToken
  const Loan = await ethers.getContractFactory("LoanToken");
  const loan = await Loan.deploy();
  await loan.waitForDeployment();
  console.log("LoanToken desplegado en:", loan.target);

  // 4) Desplegar LendingProtocol pasándole las direcciones de los dos ERC20
  const Lending = await ethers.getContractFactory("LendingProtocol");
  const lending = await Lending.deploy(collateral.target, loan.target);
  await lending.waitForDeployment();
  console.log("LendingProtocol desplegado en:", lending.target);

  // 5) Mint inicial: darle al protocolo reserva de 10 000 dDAI
  const initialReserve = ethers.parseUnits("10000", 18);
  await loan.mint(lending.target, initialReserve);
  console.log(
    `Se acuñaron ${ethers.formatUnits(initialReserve, 18)} dDAI al protocolo`
  );

  // 6)  Mint inicial de 1 000 cUSD al deployer para pruebas
  const mintToDeployer = ethers.parseUnits("1000", 18);
  await collateral.mint(deployer.address, mintToDeployer);
  console.log(
    `Se acuñaron ${ethers.formatUnits(mintToDeployer, 18)} cUSD al deployer`
  );

  // 7) Resumen de direcciones
  console.log("\n✅ Despliegue completo");
  console.log("----- Resumen de direcciones -----");
  console.log("CollateralToken:", collateral.target);
  console.log("LoanToken:      ", loan.target);
  console.log("LendingProtocol:", lending.target);

  // <<< 2. AÑADIDO: Guardar las direcciones en un archivo JSON para el frontend
  const deploymentData = {
    collateralTokenAddress: collateral.target,
    loanTokenAddress: loan.target,
    lendingProtocolAddress: lending.target,
  };

  const deploymentDataPath = "./web_app/src/deployment-addresses.json"; 
  fs.writeFileSync(deploymentDataPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\nDirecciones guardadas para el frontend en: ${deploymentDataPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });