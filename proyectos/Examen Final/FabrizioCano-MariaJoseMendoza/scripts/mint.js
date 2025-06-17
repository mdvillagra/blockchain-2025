// scripts/mintTokens.js
const { ethers } = require("hardhat");

async function main() {
  const [owner, user] = await ethers.getSigners();

  const CollateralToken = await ethers.getContractAt("CollateralToken", "DIRECCION_DEL_TOKEN_cUSD");
  const LoanToken = await ethers.getContractAt("LoanToken", "DIRECCION_DEL_TOKEN_dDAI");

  const mintAmount = ethers.parseUnits("100", 18);

  console.log(`Minting 100 cUSD and 100 dDAI to ${user.address}...`);

  await (await CollateralToken.mint(user.address, mintAmount)).wait();
  await (await LoanToken.mint(user.address, mintAmount)).wait();

  console.log("Minting complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
