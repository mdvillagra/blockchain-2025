// test/collateral-token.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralToken (ERC20)", function () {
  let Collateral, collateral;
  let owner, user;

  // Helper: X * 10^18 en Ethers v6
  function toWei(n) {
    return ethers.parseUnits(n, 18);
  }

  // Desplegamos un contrato nuevo antes de cada it()
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // 1) OBTENEMOS el ContractFactory
    Collateral = await ethers.getContractFactory("CollateralToken");

    // 2) DESPLEGAMOS el contrato (nuevo cada vez)
    collateral = await Collateral.deploy();
    await collateral.waitForDeployment(); // en v6 puede ser deploy().then()
  });

  it("debería tener el nombre y símbolo correctos", async function () {
    expect(await collateral.name()).to.equal("CollateralToken");
    expect(await collateral.symbol()).to.equal("cUSD");
  });

  it("decimals() debe ser 18 y totalSupply() inicial debe ser 0", async function () {
    expect(await collateral.decimals()).to.equal(18);
    expect(await collateral.totalSupply()).to.equal(0);
  });

  it("solo el owner puede acuñar tokens", async function () {
    const amount = toWei("1000");

    // user (no-owner) revierte
    await expect(collateral.connect(user).mint(user.address, amount)).to.be
      .reverted;

    // owner acuña sin problemas
    await collateral.mint(user.address, amount);
    expect(await collateral.balanceOf(user.address)).to.equal(amount);
  });

  it("balanceOf debe reflejar las transferencias correctas", async function () {
    const amount = toWei("500");

    // Estado aquí: user y owner tienen 0.
    // Owner acuña 500 cUSD a su propia cuenta
    await collateral.mint(owner.address, amount);
    expect(await collateral.balanceOf(owner.address)).to.equal(amount);

    // Owner transfiere 500 cUSD a user
    await collateral.transfer(user.address, amount);
    expect(await collateral.balanceOf(user.address)).to.equal(amount);
  });

  it("debe emitir Transfer en mint y en transfer", async function () {
    const to = user.address;
    const amount = toWei("100");

    // 1) Revisamos el evento Transfer cuando el owner hace mint
    await expect(collateral.mint(to, amount))
      .to.emit(collateral, "Transfer")
      .withArgs(ethers.ZeroAddress, to, amount);

    // 2) Asegurarnos de que user tenga al menos 100 cUSD (balanceOf devuelve bigint)
    let balUser = await collateral.balanceOf(user.address); // aquí es 100 e18
    if (balUser < amount) {
      const faltante = amount - balUser;
      await collateral.mint(user.address, faltante);
      balUser = await collateral.balanceOf(user.address);
    }

    // 3) Revisamos el evento Transfer cuando user transfiere 100 cUSD a owner
    await expect(collateral.connect(user).transfer(owner.address, amount))
      .to.emit(collateral, "Transfer")
      .withArgs(user.address, owner.address, amount);
  });
});
