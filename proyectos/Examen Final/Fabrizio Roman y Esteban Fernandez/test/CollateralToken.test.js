const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralToken", function () {
  let CollateralToken;
  let collateralToken;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy();
    await collateralToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await collateralToken.name()).to.equal("Collateral USD");
      expect(await collateralToken.symbol()).to.equal("cUSD");
    });

    it("Should set the right owner", async function () {
      expect(await collateralToken.owner()).to.equal(owner.address);
    });

    it("Should have correct decimals", async function () {
      expect(await collateralToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to owner", async function () {
      const initialSupply = ethers.parseEther("1000000");
      expect(await collateralToken.balanceOf(owner.address)).to.equal(initialSupply);
      expect(await collateralToken.totalSupply()).to.equal(initialSupply);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialBalance = await collateralToken.balanceOf(user1.address);
      
      await collateralToken.mint(user1.address, mintAmount);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(
        initialBalance + mintAmount
      );
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        collateralToken.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWithCustomError(collateralToken, "OwnableUnauthorizedAccount");
    });

    it("Should emit Transfer event when minting", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(collateralToken.mint(user1.address, mintAmount))
        .to.emit(collateralToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint some tokens to user1 first
      await collateralToken.mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow owner to burn tokens from user", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await collateralToken.balanceOf(user1.address);
      
      await collateralToken.burnFrom(user1.address, burnAmount);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(
        initialBalance - burnAmount
      );
    });

    it("Should not allow non-owner to burn tokens", async function () {
      const burnAmount = ethers.parseEther("500");
      
      await expect(
        collateralToken.connect(user1).burnFrom(user2.address, burnAmount)
      ).to.be.revertedWithCustomError(collateralToken, "OwnableUnauthorizedAccount");
    });

    it("Should revert when burning more than balance", async function () {
      const burnAmount = ethers.parseEther("2000");
      
      await expect(
        collateralToken.burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
    });

    it("Should emit Transfer event when burning", async function () {
      const burnAmount = ethers.parseEther("500");
      
      await expect(collateralToken.burnFrom(user1.address, burnAmount))
        .to.emit(collateralToken, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, burnAmount);
    });
  });

  describe("Standard ERC20 Functions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(collateralToken.transfer(user1.address, amount))
        .to.emit(collateralToken, "Transfer")
        .withArgs(owner.address, user1.address, amount);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should approve and transferFrom", async function () {
      const amount = ethers.parseEther("100");
      
      await collateralToken.approve(user1.address, amount);
      await collateralToken.connect(user1).transferFrom(owner.address, user2.address, amount);
      
      expect(await collateralToken.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should revert transfer when insufficient balance", async function () {
      const amount = ethers.parseEther("999999999");
      
      await expect(
        collateralToken.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
    });

    it("Should revert transferFrom when insufficient allowance", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(
        collateralToken.connect(user1).transferFrom(owner.address, user2.address, amount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
    });
  });

  describe("Public Minting Functions", function () {
    it("Should allow users to mint for testing", async function () {
      const initialBalance = await collateralToken.balanceOf(user1.address);
      
      await expect(collateralToken.connect(user1).mintForTesting())
        .to.emit(collateralToken, "Transfer");
      
      const finalBalance = await collateralToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("1000"));
    });

    it("Should revert mint for testing when cooldown active", async function () {
      await collateralToken.connect(user1).mintForTesting();
      
      await expect(
        collateralToken.connect(user1).mintForTesting()
      ).to.be.revertedWith("Mint cooldown active. Wait 24 hours between mints");
    });

    it("Should check canMint function", async function () {
      expect(await collateralToken.canMint(user2.address)).to.equal(true);
      
      await collateralToken.connect(user2).mintForTesting();
      expect(await collateralToken.canMint(user2.address)).to.equal(false);
    });

    it("Should get next mint time", async function () {
      const nextMintTime = await collateralToken.getNextMintTime(user1.address);
      expect(nextMintTime).to.be.greaterThan(0);
    });
  });
}); 