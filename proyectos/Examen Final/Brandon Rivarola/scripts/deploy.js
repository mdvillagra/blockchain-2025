const hre = require("hardhat");

async function main() 
{
  const [deployer] = await hre.ethers.getSigners();

  // Desplegar CollateralToken con el owner
  const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  await collateralToken.waitForDeployment();
  console.log("CollateralToken deployed to:", collateralToken.target);

  // Desplegar LoanToken con el owner
  const LoanToken = await hre.ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy();
  await loanToken.waitForDeployment();
  console.log("LoanToken deployed to:", loanToken.target);

  // Desplegar LendingProtocol con las direcciones de los tokens
  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralToken.target,
    loanToken.target
  );
  await lendingProtocol.waitForDeployment();
  console.log("LendingProtocol deployed to:", lendingProtocol.target);

  // Acuñar CollateralToken para el deployer para que pueda probar la app
  console.log("Acuñando CollateralTokens para el deployer...");
  const collateralToMint = hre.ethers.parseEther("10000"); // Diez mil CollateralTokens
  const mintCollateralTx = await collateralToken.mint(deployer.address, collateralToMint);
  await mintCollateralTx.wait();
  console.log(`Acuñados ${hre.ethers.formatEther(collateralToMint)} cUSD para ${deployer.address}`);

  // Añadir liquidez inicial de LoanToken al protocolo
  console.log("Añadiendo liquidez inicial al LendingProtocol...");
  // Asumimos que el token tiene 18 decimales, ajusta si es necesario.
  const initialLiquidity = hre.ethers.parseEther("100000"); // Cien mil LoanTokens

  // Acuñar tokens para el deployer ---
  console.log(`Acuñando ${hre.ethers.formatEther(initialLiquidity)} LoanTokens para ${deployer.address}...`);
  const mintTx = await loanToken.mint(deployer.address, initialLiquidity);
  await mintTx.wait();
  console.log("Acuñación completada.");

  // Aprobar al contrato LendingProtocol para que gaste los tokens del deployer
  const approveTx = await loanToken.approve(lendingProtocol.target, initialLiquidity);
  await approveTx.wait();
  console.log(`Aprobado ${lendingProtocol.target} para gastar ${hre.ethers.formatEther(initialLiquidity)} tokens`);

  // Llamar a la función para añadir liquidez
  const liquidityTx = await lendingProtocol.addLoanTokenLiquidity(initialLiquidity);
  await liquidityTx.wait();
  console.log(`Añadidos ${hre.ethers.formatEther(initialLiquidity)} LoanTokens como liquidez al protocolo.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});