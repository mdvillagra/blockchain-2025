const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // 1. Desplegar CollateralToken (por ejemplo, cUSD)
  const CollateralToken = await ethers.getContractFactory("CollateralToken", deployer);
  const collateralToken = await CollateralToken.deploy("cUSD Token", "cUSD");
  await collateralToken.waitForDeployment();
  console.log("CollateralToken deployed to:", collateralToken.target);

  // Confirmar owner
  const collateralOwner = await collateralToken.owner();
  console.log("CollateralToken owner:", collateralOwner);

  // 2. Desplegar LoanToken (por ejemplo, dDAI)
  const LoanToken = await ethers.getContractFactory("LoanToken", deployer);
  const loanToken = await LoanToken.deploy("dDAI Token", "dDAI");
  await loanToken.waitForDeployment();
  console.log("LoanToken deployed to:", loanToken.target);

  // Confirmar owner
  const loanOwner = await loanToken.owner();
  console.log("LoanToken owner:", loanOwner);

  // 3. Desplegar LendingProtocol pasando direcciones de los dos tokens
  const LendingProtocol = await ethers.getContractFactory("LendingProtocol", deployer);
  const lending = await LendingProtocol.deploy(collateralToken.target, loanToken.target);
  await lending.waitForDeployment();
  console.log("LendingProtocol deployed to:", lending.target);

  // 4. Mint tokens al usuario de prueba
  const mintAmount = ethers.parseUnits("100", 18);
  await (await collateralToken.mint(deployer.address, mintAmount)).wait();
  await (await loanToken.mint(deployer.address, mintAmount)).wait();
  console.log(`Minted 100 cUSD y 100 dDAI a ${deployer.address}`);

  // 5. Transferir parte de los LoanToken al contrato para que tenga liquidez
  const liquidityAmount = ethers.parseUnits("50", 18);
  await (await loanToken.transfer(lending.target, liquidityAmount)).wait();
  console.log(`Transferred 50 dDAI to LendingProtocol for liquidity`);
  console.log("\nDespliegue completo.");
  console.log(`CollateralToken: ${collateralToken.target}`);
  console.log(`LoanToken: ${loanToken.target}`);
  console.log(`LendingProtocol: ${lending.target}`);

  /* const tx1 = await collateralToken.transferOwnership(lending.target);
  await tx1.wait();
  console.log("Ownership of CollateralToken transferred to LendingProtocol");

  const tx2 = await loanToken.transferOwnership(lending.target);
  await tx2.wait();
  console.log("Ownership of LoanToken transferred to LendingProtocol"); */


}


main()
  .then(() => {
    console.log("Deployment completed successfully!");
  })
  .catch((error) => {
    console.error(error);

  });
