const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Usando address:", signer.address);

  const collateralTokenAddress = "0x3D2ca253f2e58e138Da432dc7aED1b77c2021143";
  const loanTokenAddress = "0x13D1FAACde3477d5D6a20a6b466261b1Bd528da9";
  const lendingProtocolAddress = "0x4d370733441E86B4EDFC18135858C76a2a9Ac7b6";

  const CollateralToken = await hre.ethers.getContractAt("CollateralToken", collateralTokenAddress);
  const LoanToken = await hre.ethers.getContractAt("LoanToken", loanTokenAddress);
  const LendingProtocol = await hre.ethers.getContractAt("LendingProtocol", lendingProtocolAddress);

  const amount = hre.ethers.parseUnits("100", 18);

  // Ver balances iniciales
  console.log("Balance inicial del usuario:");
  console.log("Colateral:", (await CollateralToken.balanceOf(signer.address)).toString());
  console.log("Préstamo:", (await LoanToken.balanceOf(signer.address)).toString());

  // Aprobar y depositar colateral
  console.log("Aprobando colateral...");
  await (await CollateralToken.approve(lendingProtocolAddress, amount)).wait();

  console.log("Depositando colateral...");
  await (await LendingProtocol.depositCollateral(amount)).wait();

  // Transferir liquidez al protocolo
  console.log("Cargando liquidez de préstamo al protocolo...");
  await (await LoanToken.transfer(lendingProtocolAddress, hre.ethers.parseUnits("1000", 18))).wait();

  // Pedir préstamo
  console.log("Pidiendo préstamo...");
  await (await LendingProtocol.borrow(hre.ethers.parseUnits("50", 18))).wait();

  console.log("Balance luego de préstamo:");
  console.log("Colateral en contrato:", (await LendingProtocol.collateralBalances(signer.address)).toString());
  console.log("Préstamo recibido:", (await LoanToken.balanceOf(signer.address)).toString());

  // Verificar deuda e interés antes de repagar
  const debt = await LendingProtocol.loanBalances(signer.address);
  const interest = debt / 20n;
  const totalOwed = debt + interest;

  console.log("Deuda actual:", debt.toString());
  console.log("Interés esperado:", interest.toString());
  console.log("Total a repagar:", totalOwed.toString());
  console.log("Balance actual de LoanToken:", (await LoanToken.balanceOf(signer.address)).toString());

  // Aprobar y repagar préstamo
  console.log("Aprobando repago...");
  await (await LoanToken.approve(lendingProtocolAddress, totalOwed)).wait();

  console.log("Repagando préstamo...");
  await (await LendingProtocol.repay()).wait();

  // Retirar colateral
  console.log("Retirando colateral...");
  await (await LendingProtocol.withdrawCollateral()).wait();

  console.log("Balance final:");
  console.log("Colateral:", (await CollateralToken.balanceOf(signer.address)).toString());
  console.log("Préstamo:", (await LoanToken.balanceOf(signer.address)).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
