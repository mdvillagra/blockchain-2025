require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const recipient = process.env.MINT_TO;
  const contract = process.env.VITE_CONTRACT_ADDRESS;

  const collateralAddress = process.env.VITE_COLLATERAL_TOKEN_ADDRESS;
  const loanAddress = process.env.VITE_LOAN_TOKEN_ADDRESS;

  const CollateralToken = await hre.ethers.getContractAt("CollateralToken", collateralAddress);
  const LoanToken = await hre.ethers.getContractAt("LoanToken", loanAddress);

  const amount = hre.ethers.parseEther("1000");
  const gasPrice = hre.ethers.parseUnits("30", "gwei");

  console.log(`Minting tokens to ${recipient}...`);

  const tx1 = await CollateralToken.connect(owner).mint(recipient, amount, { gasPrice });
  await tx1.wait();
  console.log("cUSD minted");

  const tx2 = await LoanToken.connect(owner).mint(recipient, amount, { gasPrice });
  await tx2.wait();
  console.log("dDAI minted to user");

  const tx3 = await LoanToken.connect(owner).mint(contract, amount, { gasPrice });
  await tx3.wait();
  console.log("dDAI minted to contract");

  console.log("Mint completado: 1000 cUSD y 1000 dDAI");
}

main().catch((error) => {
  console.error("Error en el script:", error);
  process.exitCode = 1;
});
