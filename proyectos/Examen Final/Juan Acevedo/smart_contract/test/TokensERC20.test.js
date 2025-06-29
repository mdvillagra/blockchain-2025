const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tokens ERC20", function () {
  let collateralToken, loanToken, lendingProtocol;
  let owner, user1, user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000");
  const COLLATERAL_AMOUNT = ethers.parseEther("150");
  const BORROW_AMOUNT = ethers.parseEther("100");
  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const LoanToken = await ethers.getContractFactory("LoanToken");
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");

    collateralToken = await CollateralToken.deploy(owner.address);
    loanToken = await LoanToken.deploy(owner.address);
    lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress(),
      owner.address
    );

    await collateralToken.mint(user1.address, INITIAL_SUPPLY);
    await loanToken.mint(await lendingProtocol.getAddress(), INITIAL_SUPPLY);
  });

  it("CollateralToken: Solo owner puede emitir tokens", async function () {
    await expect(collateralToken.connect(user1).mint(user2.address, 100))
      .to.be.revertedWithCustomError(collateralToken, "OwnableUnauthorizedAccount");
    
    await collateralToken.mint(user2.address, 100);
    expect(await collateralToken.balanceOf(user2.address)).to.equal(100);
  });

  it("LoanToken: Solo owner puede emitir tokens", async function () {
    await expect(loanToken.connect(user1).mint(user2.address, 100))
      .to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
    
    await loanToken.mint(user2.address, 100);
    expect(await loanToken.balanceOf(user2.address)).to.equal(100);
  });
});