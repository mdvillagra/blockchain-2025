const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken", function () {
  let owner, user, token;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LoanToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();
  });

  it("permite al owner mintear tokens", async function () {
    await token.connect(owner).mint(user.address, ethers.parseEther("500"));
    const balance = await token.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("500"));
  });

  it("no permite mintear si no es el owner", async function () {
    await expect(
      token.connect(user).mint(user.address, ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount").withArgs(user.address);
  });
});
