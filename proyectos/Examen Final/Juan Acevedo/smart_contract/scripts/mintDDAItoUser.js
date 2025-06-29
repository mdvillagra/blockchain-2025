const { ethers } = require("hardhat");

async function main() {
  console.log("=== Minteando dDAI para usuario ===");

  const [deployer] = await ethers.getSigners();
  console.log("Cuenta del propietario:", deployer.address);

  const LOAN_TOKEN_ADDRESS = "0x6d91AEEc9F430aAFFd921cc0012181551098ddf0";

  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = LoanToken.attach(LOAN_TOKEN_ADDRESS).connect(deployer);

  const loanOwner = await loanToken.owner();
  console.log("Propietario de LoanToken:", loanOwner);
  if (loanOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("La cuenta actual no es el propietario de LoanToken");
  }

  console.log("\nMinteando dDAI para usuario...");
  const initialDDAIUserAmount = ethers.parseUnits("100", 18);
  const user = "0x972829dabC2b673cd54CA86CF8551Ed8D46eF094";

  const mintDDAIUserTx = await loanToken.mint(user, initialDDAIUserAmount);
  await mintDDAIUserTx.wait();
  console.log(`Minteados ${ethers.formatUnits(initialDDAIUserAmount, 18)} dDAI para ${user}`);
  const dDAIUserBalance = await loanToken.balanceOf(user);
  console.log(`Balance de dDAI de ${user}: ${ethers.formatUnits(dDAIUserBalance, 18)}`);

  console.log("\nMinteo de dDAI completado.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el minteo:", error);
    process.exit(1);
  });