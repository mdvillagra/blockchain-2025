const { ethers } = require("hardhat");

async function main() {
  console.log("=== Minteando dDAI para LendingProtocol ===");

  const [deployer] = await ethers.getSigners();
  console.log("Cuenta del propietario:", deployer.address);

  const LOAN_TOKEN_ADDRESS = "0x6d91AEEc9F430aAFFd921cc0012181551098ddf0";
  const LENDING_PROTOCOL_ADDRESS = "0x3Ee788322bE73c3A82Ef82828F019F8709ad3A9e";

  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = LoanToken.attach(LOAN_TOKEN_ADDRESS).connect(deployer);

  const loanOwner = await loanToken.owner();
  console.log("Propietario de LoanToken:", loanOwner);
  if (loanOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("La cuenta actual no es el propietario de LoanToken");
  }

  console.log("\nMinteando dDAI para LendingProtocol...");
  const initialDDAIAmount = ethers.parseUnits("1000", 18);
  const mintDDAITx = await loanToken.mint(LENDING_PROTOCOL_ADDRESS, initialDDAIAmount);
  await mintDDAITx.wait();
  console.log(`Minteados ${ethers.formatUnits(initialDDAIAmount, 18)} dDAI`);
  const dDAIBalance = await loanToken.balanceOf(LENDING_PROTOCOL_ADDRESS);
  console.log(`Balance de dDAI en LendingProtocol: ${ethers.formatUnits(dDAIBalance, 18)}`);

  console.log("\nMinteo de dDAI completado.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el minteo:", error);
    process.exit(1);
  });