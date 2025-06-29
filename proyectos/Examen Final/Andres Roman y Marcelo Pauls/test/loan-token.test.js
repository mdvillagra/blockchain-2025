// test/loan-token.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken (ERC20)", function () {
  let Loan, loan;
  let owner, user;

  // Helper: X * 10^18 en Ethers v6
  function toWei(n) {
    return ethers.parseUnits(n, 18);
  }

  // Desplegamos un contrato nuevo antes de cada it()
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // 1) OBTENEMOS el ContractFactory
    Loan = await ethers.getContractFactory("LoanToken");

    // 2) DESPLEGAMOS el contrato (nuevo cada vez)
    loan = await Loan.deploy();
    await loan.waitForDeployment();
  });

  it("debería tener el nombre y símbolo correctos", async function () {
    expect(await loan.name()).to.equal("LoanToken");
    expect(await loan.symbol()).to.equal("dDAI");
  });

  it("decimals() debe ser 18 y totalSupply() inicial debe ser 0", async function () {
    expect(await loan.decimals()).to.equal(18);
    expect(await loan.totalSupply()).to.equal(0);
  });

  it("solo el owner puede acuñar tokens", async function () {
    const amount = toWei("500");

    // user (no-owner) revierte (sin texto específico)
    await expect(loan.connect(user).mint(user.address, amount)).to.be.reverted;

    // owner acuña sin problemas
    await loan.mint(user.address, amount);
    expect(await loan.balanceOf(user.address)).to.equal(amount);
  });

  it("balanceOf debe reflejar las transferencias correctas", async function () {
    const amount = toWei("200");

    // Owner acuña 200 dDAI a su propia cuenta
    await loan.mint(owner.address, amount);
    expect(await loan.balanceOf(owner.address)).to.equal(amount);

    // Owner transfiere 200 dDAI a user
    await loan.transfer(user.address, amount);
    expect(await loan.balanceOf(user.address)).to.equal(amount);
  });

  it("debe emitir Transfer en mint y en transfer", async function () {
    const to = user.address;
    const amount = toWei("50");

    // 1) Evento Transfer(address(0), to, amount) al hacer mint
    await expect(loan.mint(to, amount))
      .to.emit(loan, "Transfer")
      .withArgs(ethers.ZeroAddress, to, amount);

    // 2) Asegurarnos de que user tenga al menos 50 dDAI
    let balUser = await loan.balanceOf(user.address);
    if (balUser < amount) {
      const faltante = amount - balUser;
      await loan.mint(user.address, faltante);
      balUser = await loan.balanceOf(user.address);
    }

    // 3) Evento Transfer(user, owner, amount) al hacer transfer
    await expect(loan.connect(user).transfer(owner.address, amount))
      .to.emit(loan, "Transfer")
      .withArgs(user.address, owner.address, amount);
  });
});
