const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
  let lendingProtocol;
  let collateralToken;
  let loanToken;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy CollateralToken
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy("Collateral Token", "COL", owner.address);
    await collateralToken.waitForDeployment();

    // Deploy LoanToken
    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy("Loan Token", "LOAN", owner.address);
    await loanToken.waitForDeployment();

    // Deploy LendingProtocol
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress()
    );
    await lendingProtocol.waitForDeployment();

    console.log("Collateral address:", await collateralToken.getAddress());
    console.log("Loan address:", await loanToken.getAddress());
  });

  it("should deposit collateral", async function () {
    await collateralToken.connect(owner).transfer(user.address, 1000);
    await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), 1000);

    await lendingProtocol.connect(user).depositCollateral(1000);

    const deposited = await lendingProtocol.collateralBalances(user.address);
    expect(deposited).to.equal(1000);
  });
it("should allow borrowing up to 50% of the collateral", async function () {
  // Transferir 1000 tokens COL al usuario
  await collateralToken.connect(owner).transfer(user.address, 1000);

  // El usuario aprueba al protocolo para mover sus tokens
  await collateralToken.connect(user).approve(lendingProtocol.target, 1000);

  // Deposita colateral
  await lendingProtocol.connect(user).depositCollateral(1000);

  // El protocolo necesita tener tokens LOAN para poder prestar
  await loanToken.connect(owner).transfer(lendingProtocol.target, 500);

  // El usuario pide prestado 400 LOAN (válido: 50% de 1000 = 500)
  await lendingProtocol.connect(user).borrow(400);

  // Verificamos que el usuario recibió los LOAN
  const loanBalance = await loanToken.balanceOf(user.address);
  expect(loanBalance).to.equal(400);

  // Verificamos que el sistema registró la deuda
  const internalLoanBalance = await lendingProtocol.loanBalances(user.address);
  expect(internalLoanBalance).to.equal(400);
});
  it("should allow repayment of the loan with interest", async () => {
    const depositAmount = 1000;
    const borrowAmount = 400; // 40% del colateral

    await collateralToken.connect(owner).transfer(user.address, depositAmount);
    await collateralToken.connect(user).approve(lendingProtocol.target, depositAmount);
    await lendingProtocol.connect(user).depositCollateral(depositAmount);

    await loanToken.connect(owner).transfer(lendingProtocol.target, 1000); // fondo del protocolo
    await lendingProtocol.connect(user).borrow(borrowAmount);

    const interest = borrowAmount / 20;
    const totalRepay = borrowAmount + interest;

    await loanToken.connect(owner).transfer(user.address, totalRepay);
    await loanToken.connect(user).approve(lendingProtocol.target, totalRepay);

    await lendingProtocol.connect(user).repay();

    const newBalance = await lendingProtocol.loanBalances(user.address);
    expect(newBalance).to.equal(0);
  });
    it("should allow withdrawal of collateral after repayment", async () => {
    const depositAmount = 1000;
    const borrowAmount = 400;

    await collateralToken.connect(owner).transfer(user.address, depositAmount);
    await collateralToken.connect(user).approve(lendingProtocol.target, depositAmount);
    await lendingProtocol.connect(user).depositCollateral(depositAmount);

    await loanToken.connect(owner).transfer(lendingProtocol.target, 1000);
    await lendingProtocol.connect(user).borrow(borrowAmount);

    const interest = borrowAmount / 20;
    const totalRepay = borrowAmount + interest;
    await loanToken.connect(owner).transfer(user.address, totalRepay);
    await loanToken.connect(user).approve(lendingProtocol.target, totalRepay);
    await lendingProtocol.connect(user).repay();

    await lendingProtocol.connect(user).withdrawCollateral();

    const balance = await collateralToken.balanceOf(user.address);
    expect(balance).to.equal(depositAmount);
  });
});

