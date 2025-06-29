const { ethers } = require("hardhat");

async function main() {
  console.log("=== Minteando cUSD para usuario ===");

  const [deployer] = await ethers.getSigners();
  console.log("Cuenta del propietario:", deployer.address);

  const COLLATERAL_TOKEN_ADDRESS = "0x996B0C6dd5A33DbDe05D54B0C2a7a4db99e1dF03";

  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = CollateralToken.attach(COLLATERAL_TOKEN_ADDRESS).connect(deployer);

  const collateralOwner = await collateralToken.owner();
  console.log("Propietario de CollateralToken:", collateralOwner);
  if (collateralOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("La cuenta actual no es el propietario de CollateralToken");
  }

  console.log("\nMinteando cUSD para usuario...");
  const initialCUSDAmount = ethers.parseUnits("100", 18);
  const user = "0x972829dabC2b673cd54CA86CF8551Ed8D46eF094";

  const mintCUSDTx = await collateralToken.mint(user, initialCUSDAmount);
  await mintCUSDTx.wait();
  console.log(`Minteados ${ethers.formatUnits(initialCUSDAmount, 18)} cUSD para ${user}`);
  const cUSDBalance = await collateralToken.balanceOf(user);
  console.log(`Balance de cUSD de ${user}: ${ethers.formatUnits(cUSDBalance, 18)}`);

  console.log("\nMinteo de cUSD completado.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el minteo:", error);
    process.exit(1);
  });