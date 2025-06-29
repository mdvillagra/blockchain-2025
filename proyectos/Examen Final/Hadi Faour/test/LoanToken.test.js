const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken", function () {
  let owner, user1;
  let loanToken;

  before(async function () {
    ({ owner, loanToken } = await deployLoanToken());
    [owner, user1] = await ethers.getSigners();

    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy();
    await loanToken.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await loanToken.name()).to.equal("Loan DAI");
    expect(await loanToken.symbol()).to.equal("dDAI");
  });

  it("should allow owner to mint tokens", async function () {
    await expect(loanToken.mint(user1.address, 1000))
      .to.emit(loanToken, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, 1000);
    
    expect(await loanToken.balanceOf(user1.address)).to.equal(1000);
  });

  it("should allow owner to burn tokens", async function () {
    // First approve the owner to burn from user1
    await loanToken.connect(user1).approve(owner.address, 500);
    
    await expect(loanToken.burnFrom(user1.address, 500))
      .to.emit(loanToken, "Transfer")
      .withArgs(user1.address, ethers.ZeroAddress, 500);
    
    expect(await loanToken.balanceOf(user1.address)).to.equal(500);
  });

  it("should not allow non-owners to mint", async function () {
    await expect(loanToken.connect(user1).mint(user1.address, 100))
      .to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
  });

  it("should not allow non-owners to burn", async function () {
    await expect(loanToken.connect(user1).burnFrom(user1.address, 100))
      .to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
  });
});