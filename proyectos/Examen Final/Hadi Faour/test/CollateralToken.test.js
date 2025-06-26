const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralToken", function () {
  let owner, user1, lendingProtocol;
  let collateralToken;

  before(async function () {
    ({ owner, collateralToken } = await deployCollateralToken());
    [owner, user1] = await ethers.getSigners();

    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy();
    await collateralToken.waitForDeployment();

    // Mock lending protocol address
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocol.deploy(ethers.ZeroAddress, ethers.ZeroAddress);
    await lendingProtocol.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await collateralToken.name()).to.equal("Collateral USD");
    expect(await collateralToken.symbol()).to.equal("cUSD");
  });

  it("should allow owner to mint tokens", async function () {
    await expect(collateralToken.mint(user1.address, 1000))
      .to.emit(collateralToken, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, 1000);
    
    expect(await collateralToken.balanceOf(user1.address)).to.equal(1000);
  });

  it("should allow lending protocol to mint tokens", async function () {
    // Transfer ownership to lending protocol
    await collateralToken.transferOwnership(await lendingProtocol.getAddress());
    
    // Connect as lending protocol (owner)
    await expect(collateralToken.connect(lendingProtocol.runner).mint(user1.address, 500))
      .to.emit(collateralToken, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, 500);
    
    expect(await collateralToken.balanceOf(user1.address)).to.equal(1500);
  });

  it("should not allow non-authorized users to mint", async function () {
    await expect(collateralToken.connect(user1).mint(user1.address, 100))
      .to.be.revertedWith("Not authorized");
  });
});