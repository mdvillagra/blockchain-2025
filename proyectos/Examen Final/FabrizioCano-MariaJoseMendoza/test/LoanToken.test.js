const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken", function () {
  let LoanToken, loanToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy("Dollar DAI", "dDAI");
    await loanToken.deployed();
  });

  it("debe tener nombre y símbolo correctos", async function () {
    expect(await loanToken.name()).to.equal("Dollar DAI");
    expect(await loanToken.symbol()).to.equal("dDAI");
  });

  it("permite al owner mintear tokens", async function () {
    await loanToken.mint(user1.address, 1000);
    expect(await loanToken.balanceOf(user1.address)).to.equal(1000);
  });

  it("restringe mint solo al owner", async function () {
    await expect(
      loanToken.connect(user1).mint(user1.address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("permite a un usuario quemar sus propios tokens", async function () {
    await loanToken.mint(user1.address, 500);
    await loanToken.connect(user1).burn(200);
    expect(await loanToken.balanceOf(user1.address)).to.equal(300);
  });

  it("permite burnFrom con allowance suficiente", async function () {
    await loanToken.mint(user1.address, 500);
    await loanToken.connect(user1).approve(user2.address, 300);
    await loanToken.connect(user2).burnFrom(user1.address, 300);
    expect(await loanToken.balanceOf(user1.address)).to.equal(200);
  });

  it("falla burnFrom si allowance es insuficiente", async function () {
    await loanToken.mint(user1.address, 500);
    await loanToken.connect(user1).approve(user2.address, 100);
    await expect(
      loanToken.connect(user2).burnFrom(user1.address, 200)
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });
});
