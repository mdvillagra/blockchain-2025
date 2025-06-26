const { ethers } = require("hardhat");

async function deployContracts() {
  const [owner, user1, user2] = await ethers.getSigners();

  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  await collateralToken.waitForDeployment();

  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy();
  await loanToken.waitForDeployment();

  const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
  const lendingProtocol = await LendingProtocol.deploy(
    await collateralToken.getAddress(),
    await loanToken.getAddress()
  );
  await lendingProtocol.waitForDeployment();

  // Transfer ownership of tokens to lending protocol
  await collateralToken.transferOwnership(await lendingProtocol.getAddress());
  await loanToken.transferOwnership(await lendingProtocol.getAddress());

  return { owner, user1, user2, collateralToken, loanToken, lendingProtocol };
}

async function deployLoanToken() {
  const [owner] = await ethers.getSigners();
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy();
  await loanToken.waitForDeployment();
  return { owner, loanToken };
}

async function deployCollateralToken() {
  const [owner] = await ethers.getSigners();
  const CollateralToken = await ethers.getContractFactory("CollateralToken");
  const collateralToken = await CollateralToken.deploy();
  await collateralToken.waitForDeployment();
  return { owner, collateralToken };
}

module.exports = {
  deployContracts,
  deployLoanToken,
  deployCollateralToken,
};