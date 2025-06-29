const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  // Obtener el nonce actual y esperar a que no haya transacciones pendientes
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);
  let pendingNonce = await hre.ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log("Nonce actual:", nonce);
  console.log("Nonce pendiente:", pendingNonce);
  
  if (nonce !== pendingNonce) {
    console.log("⚠️  Hay transacciones pendientes. Esperando 30 segundos...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    nonce = await hre.ethers.provider.getTransactionCount(deployer.address);
    console.log("Nuevo nonce:", nonce);
  }

  // Obtener gas price con un margen de seguridad
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice * 150n / 100n; // 50% más alto para seguridad
  console.log("Gas price configurado:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // 1. Deploy CollateralToken
  console.log("Desplegando CollateralToken...");
  const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy({
    gasPrice: gasPrice,
    nonce: nonce++
  });
  await collateralToken.waitForDeployment();
  console.log("CollateralToken (cUSD) desplegado en:", collateralToken.target);

  // 2. Deploy LoanToken
  console.log("Desplegando LoanToken...");
  const LoanToken = await hre.ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy({
    gasPrice: gasPrice,
    nonce: nonce++
  });
  await loanToken.waitForDeployment();
  console.log("LoanToken (dDAI) desplegado en:", loanToken.target);

  // 3. Deploy LendingProtocol
  console.log("Desplegando LendingProtocol...");
  const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    collateralToken.target,
    loanToken.target,
    {
      gasPrice: gasPrice,
      nonce: nonce++
    }
  );
  await lendingProtocol.waitForDeployment();
  console.log("LendingProtocol desplegado en:", lendingProtocol.target);

  // 4. Transferir la propiedad del LoanToken al LendingProtocol
  console.log("Transfiriendo propiedad del LoanToken al LendingProtocol...");
  const tx = await loanToken.transferOwnership(lendingProtocol.target);
  await tx.wait();
  console.log("Propiedad transferida.");

  // 5. Guardar direcciones en un archivo (útil para frontend)
  const data = {
    collateralToken: collateralToken.target,
    loanToken: loanToken.target,
    lendingProtocol: lendingProtocol.target
  };

  fs.writeFileSync("web_app/src/deployed-addresses.json", JSON.stringify(data, null, 2));
  console.log("Direcciones guardadas en web_app/src/deployed-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
