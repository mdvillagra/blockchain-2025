const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralToken", function () {
  let CollateralToken, collateralToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy("Collateral USD", "cUSD");
    await collateralToken.deployed();
  });

  it("debe tener nombre y símbolo correctos", async function () {
    expect(await collateralToken.name()).to.equal("Collateral USD");
    expect(await collateralToken.symbol()).to.equal("cUSD");
  });

  it("permite al owner mintear tokens", async function () {
    await collateralToken.mint(user1.address, 1000);
    expect(await collateralToken.balanceOf(user1.address)).to.equal(1000);
  });

  it("restringe mint solo al owner", async function () {
    await expect(
      collateralToken.connect(user1).mint(user1.address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("permite a un usuario quemar sus propios tokens", async function () {
    await collateralToken.mint(user1.address, 500);
    await collateralToken.connect(user1).burn(200);
    expect(await collateralToken.balanceOf(user1.address)).to.equal(300);
  });

  it("permite burnFrom con allowance suficiente", async function () {
    await collateralToken.mint(user1.address, 500);
    await collateralToken.connect(user1).approve(user2.address, 300);
    await collateralToken.connect(user2).burnFrom(user1.address, 300);
    expect(await collateralToken.balanceOf(user1.address)).to.equal(200);
  });

  it("falla burnFrom si allowance es insuficiente", async function () {
    await collateralToken.mint(user1.address, 500);
    await collateralToken.connect(user1).approve(user2.address, 100);
    await expect(
      collateralToken.connect(user2).burnFrom(user1.address, 200)
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });
});
