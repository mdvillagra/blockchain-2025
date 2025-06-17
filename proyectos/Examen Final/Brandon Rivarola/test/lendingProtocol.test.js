const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
  let owner, user, other;
  let CollateralToken, LoanToken, LendingProtocol;
  let collateralToken, loanToken, lendingProtocol;

  beforeEach(async function () {
    [owner, user, other] = await ethers.getSigners();
    CollateralToken = await ethers.getContractFactory("CollateralToken");
    LoanToken = await ethers.getContractFactory("LoanToken");
    LendingProtocol = await ethers.getContractFactory("LendingProtocol");

    collateralToken = await CollateralToken.deploy();
    loanToken = await LoanToken.deploy()
    lendingProtocol = await LendingProtocol.connect(owner).deploy(collateralToken.address, loanToken.address);

    // Mint tokens for user
    await collateralToken.connect(owner).mint(user.address, ethers.parseEther("1000"));
    await loanToken.connect(owner).mint(lendingProtocol.address, ethers.parseEther("10000"));
  });

  it("Deposito de colateral exitoso", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("100"));
    await lendingProtocol.connect(user).depositCollateral(ethers.parseEther("100"));
    expect(await lendingProtocol.collateralBalances(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("Error en deposito de colateral insuficiente", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, 0);
    await expect(
      lendingProtocol.connect(user).depositCollateral(0)
    ).to.be.revertedWith("Debes depositar una cantidad valida.");
  });

  it("Solicitud de préstamo exitosa", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("150"));
    await lendingProtocol.connect(user).depositCollateral(ethers.parseEther("150"));
    await lendingProtocol.connect(user).borrow(ethers.parseEther("100"));
    expect(await lendingProtocol.loanBalances(user.address)).to.equal(ethers.parseEther("100"));
    expect(await loanToken.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("Error en solicitud de préstamo por colateral insuficiente", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("100"));
    await lendingProtocol.connect(user).depositCollateral(ethers.parseEther("100"));
    await expect(
      lendingProtocol.connect(user).borrow(ethers.parseEther("100"))
    ).to.be.revertedWith("No cumple con el ratio de colateralizacion.");
  });

  it("Repago exitoso y retiro de colateral", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("150"));
    await lendingProtocol.connect(user).depositCollateral(ethers.parseEther("150"));
    await lendingProtocol.connect(user).borrow(ethers.parseEther("100"));
    // Simula interés acumulado
    await lendingProtocol.connect(owner).accrueInterest(user.address);
    const totalDebt = (await lendingProtocol.loanBalances(user.address)).add(await lendingProtocol.accruedInterest(user.address));
    await loanToken.connect(owner).mint(user.address, totalDebt);
    await loanToken.connect(user).approve(lendingProtocol.address, totalDebt);
    await lendingProtocol.connect(user).repay();
    expect(await lendingProtocol.loanBalances(user.address)).to.equal(0);
    expect(await lendingProtocol.accruedInterest(user.address)).to.equal(0);
    await lendingProtocol.connect(user).withdrawCollateral();
    expect(await lendingProtocol.collateralBalances(user.address)).to.equal(0);
    expect(await collateralToken.balanceOf(user.address)).to.equal(ethers.parseEther("150"));
  });

  it("Error al retirar colateral con deuda activa", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("150"));
    await lendingProtocol.connect(user).depositCollateral(ethers.parseEther("150"));
    await lendingProtocol.connect(user).borrow(ethers.parseEther("100"));
    await expect(
      lendingProtocol.connect(user).withdrawCollateral()
    ).to.be.revertedWith("Aun tienes deuda activa.");
  });

  it("Error al repagar con saldo insuficiente", async function () {
    await collateralToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("150"));
    await lendingProtocol.connect(user).depositCollateral(ethers.parseEther("150"));
    await lendingProtocol.connect(user).borrow(ethers.parseEther("100"));
    await lendingProtocol.connect(owner).accrueInterest(user.address);
    // No tiene saldo suficiente
    await loanToken.connect(user).approve(lendingProtocol.address, ethers.parseEther("50"));
    await expect(
      lendingProtocol.connect(user).repay()
    ).to.be.revertedWith("Saldo insuficiente.");
  });
});

describe("CollateralToken y LoanToken", function () {
  let owner, user;
  let CollateralToken, LoanToken;
  let collateralToken, loanToken;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    CollateralToken = await ethers.getContractFactory("CollateralToken");
    LoanToken = await ethers.getContractFactory("LoanToken");
    collateralToken = await CollateralToken.deploy();
    loanToken = await LoanToken.deploy();
  });

  it("Solo el owner puede mintear CollateralToken", async function () {
    await collateralToken.connect(owner).mint(user.address, 1000);
    expect(await collateralToken.balanceOf(user.address)).to.equal(1000);
    await expect(
      collateralToken.connect(user).mint(user.address, 1000)
    ).to.be.revertedWithCustomError(collateralToken, "OwnableUnauthorizedAccount");
  });

  it("Solo el owner puede mintear LoanToken", async function () {
    await loanToken.connect(owner).mint(user.address, 1000);
    expect(await loanToken.balanceOf(user.address)).to.equal(1000);
    await expect(
      loanToken.connect(user).mint(user.address, 1000)
    ).to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
  });
});
