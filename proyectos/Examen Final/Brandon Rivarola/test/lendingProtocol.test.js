const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contracts", function () {
  let collateralToken, loanToken, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const CollateralTokenFactory = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralTokenFactory.deploy();
    await collateralToken.waitForDeployment();

    const LoanTokenFactory = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanTokenFactory.deploy();
    await loanToken.waitForDeployment();
  });

  describe("CollateralToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await collateralToken.name()).to.equal("Collateral USD");
      expect(await collateralToken.symbol()).to.equal("cUSD");
    });

    it("Should allow owner to mint", async function () {
      await collateralToken.mint(addr1.address, 1000);
      expect(await collateralToken.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(collateralToken.connect(addr1).mint(addr1.address, 1000))
        .to.be.revertedWithCustomError(collateralToken, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("LoanToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await loanToken.name()).to.equal("Loan DAI");
      expect(await loanToken.symbol()).to.equal("dDAI");
    });

    it("Should allow owner to mint", async function () {
      await loanToken.mint(addr1.address, 1000);
      expect(await loanToken.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(loanToken.connect(addr1).mint(addr1.address, 1000))
        .to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("Should correctly set the owner upon deployment", async function() {
      expect(await loanToken.owner()).to.equal(owner.address);
    });
  
    it("Should revert when attempting to mint to the zero address", async function () {
      const zeroAddress = ethers.ZeroAddress;
      await expect(loanToken.mint(zeroAddress, 1000))
        .to.be.revertedWithCustomError(loanToken, "ERC20InvalidReceiver")
        .withArgs(zeroAddress);
    });
  
    it("Should allow minting zero tokens without changing balance", async function () {
      const initialBalance = await loanToken.balanceOf(addr1.address);
      await loanToken.mint(addr1.address, 0);
      const finalBalance = await loanToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance);
    });
  });
});

describe("LendingProtocol", function () {
  let lendingProtocol, collateralToken, loanToken;
  let owner, user1, user2;
  const collateralAmount = ethers.parseEther("150");
  const loanAmount = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CollateralTokenFactory = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralTokenFactory.deploy();
    await collateralToken.waitForDeployment();

    const LoanTokenFactory = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanTokenFactory.deploy();
    await loanToken.waitForDeployment();

    const LendingProtocolFactory = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocolFactory.deploy(await collateralToken.getAddress(), await loanToken.getAddress());
    await lendingProtocol.waitForDeployment();

    await collateralToken.mint(user1.address, collateralAmount);
    await loanToken.mint(await lendingProtocol.getAddress(), ethers.parseEther("1000"));
    await loanToken.mint(user1.address, ethers.parseEther("110"));
  });

  it("Should allow the owner to add loan token liquidity", async function () {
    const liquidityAmount = ethers.parseEther("500");
    await loanToken.mint(owner.address, liquidityAmount);
    await loanToken.connect(owner).approve(await lendingProtocol.getAddress(), liquidityAmount);
    
    const initialContractBalance = await loanToken.balanceOf(await lendingProtocol.getAddress());
    
    await lendingProtocol.connect(owner).addLoanTokenLiquidity(liquidityAmount);
    
    const finalContractBalance = await loanToken.balanceOf(await lendingProtocol.getAddress());
    expect(finalContractBalance).to.equal(initialContractBalance + liquidityAmount);
  });

  it("Should not allow a non-owner to add liquidity", async function () {
    const liquidityAmount = ethers.parseEther("500");
    await loanToken.mint(user1.address, liquidityAmount);
    await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), liquidityAmount);

    await expect(lendingProtocol.connect(user1).addLoanTokenLiquidity(liquidityAmount))
      .to.be.revertedWithCustomError(lendingProtocol, "OwnableUnauthorizedAccount")
      .withArgs(user1.address);
  });

  it("Should fail to add zero liquidity", async function () {
    await expect(lendingProtocol.connect(owner).addLoanTokenLiquidity(0))
      .to.be.revertedWith("La cantidad debe ser mayor que cero.");
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lendingProtocol.owner()).to.equal(owner.address);
    });

    it("Should set the correct token addresses", async function () {
      expect(await lendingProtocol.collateralTokenAddress()).to.equal(await collateralToken.getAddress());
      expect(await lendingProtocol.loanTokenAddress()).to.equal(await loanToken.getAddress());
    });
  });

  describe("Collateral Management", function () {
    it("Should allow a user to deposit collateral", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(collateralAmount);
      expect(await collateralToken.balanceOf(await lendingProtocol.getAddress())).to.equal(collateralAmount);
    });

    it("Should fail to deposit zero collateral", async function () {
      await expect(lendingProtocol.connect(user1).depositCollateral(0))
        .to.be.revertedWith("Debes depositar una cantidad valida.");
    });

    it("Should allow a user to withdraw collateral if there is no debt", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
      
      const initialBalance = await collateralToken.balanceOf(user1.address);
      await lendingProtocol.connect(user1).withdrawCollateral();

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(0);
      expect(await collateralToken.balanceOf(user1.address)).to.equal(initialBalance + collateralAmount);
    });

    it("Should fail to withdraw collateral if there is active debt", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
      await lendingProtocol.connect(user1).borrow(loanAmount);

      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.be.revertedWith("Aun tienes deuda activa.");
    });

    it("Should fail to withdraw collateral if there is no collateral", async function () {
      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.be.revertedWith("No tienes colateral para retirar.");
    });
  });

  describe("Borrowing", function () {
    beforeEach(async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
    });

    it("Should allow a user to borrow within the collateral ratio", async function () {
      const initialLoanBalance = await loanToken.balanceOf(user1.address);
      await lendingProtocol.connect(user1).borrow(loanAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.debt).to.equal(loanAmount);
      expect(await loanToken.balanceOf(user1.address)).to.equal(initialLoanBalance + loanAmount);
    });

    it("Should fail to borrow if collateral ratio is not met", async function () {
      const excessiveLoanAmount = ethers.parseEther("101");
      await expect(lendingProtocol.connect(user1).borrow(excessiveLoanAmount))
        .to.be.revertedWith("No cumple con el ratio de colateralizacion.");
    });
  });

  describe("Interest and Repayment", function () {
    beforeEach(async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
      await lendingProtocol.connect(user1).borrow(loanAmount);
    });

    it("Should accrue interest correctly", async function () {
      await lendingProtocol.accrueInterest(user1.address);
      const expectedInterest = (loanAmount * BigInt(5)) / BigInt(100);
      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.interest).to.equal(expectedInterest);
    });

    it("Should fail to accrue interest if there is no debt", async function () {
      await expect(lendingProtocol.accrueInterest(user2.address))
        .to.be.revertedWith("No hay deuda activa.");
    });

    it("Should allow a user to repay the loan with pre-accrued interest", async function () {
      await lendingProtocol.accrueInterest(user1.address);
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData.debt + userData.interest;

      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();

      const finalUserData = await lendingProtocol.getUserData(user1.address);
      expect(finalUserData.debt).to.equal(0);
      expect(finalUserData.interest).to.equal(0);
    });

    it("Should implicitly accrue interest on repay if not done explicitly", async function () {
      const expectedInterest = (loanAmount * BigInt(5)) / BigInt(100);
      const totalDebt = loanAmount + expectedInterest;

      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();

      const finalUserData = await lendingProtocol.getUserData(user1.address);
      expect(finalUserData.debt).to.equal(0);
      expect(finalUserData.interest).to.equal(0);
    });

    it("Should fail to repay if user has insufficient loan token balance", async function () {
      await lendingProtocol.accrueInterest(user1.address);
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData.debt + userData.interest;

      const userBalance = await loanToken.balanceOf(user1.address);
      await loanToken.connect(user1).transfer(owner.address, userBalance);

      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      await expect(lendingProtocol.connect(user1).repay())
        .to.be.revertedWith("Saldo insuficiente.");
    });

    it("Should do nothing on repay if there is no debt", async function () {
      const initialContractBalance = await loanToken.balanceOf(await lendingProtocol.getAddress());
      await lendingProtocol.connect(user2).repay();
      const finalContractBalance = await loanToken.balanceOf(await lendingProtocol.getAddress());
      expect(initialContractBalance).to.equal(finalContractBalance);
    });
  });

  describe("View Functions", function () {
    it("getUserData should return correct initial data", async function () {
      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(0);
      expect(userData.debt).to.equal(0);
      expect(userData.interest).to.equal(0);
    });

    it("getUserData should return correct data after operations", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
      await lendingProtocol.connect(user1).borrow(loanAmount);
      await lendingProtocol.accrueInterest(user1.address);

      const userData = await lendingProtocol.getUserData(user1.address);
      const expectedInterest = (loanAmount * BigInt(5)) / BigInt(100);

      expect(userData.collateral).to.equal(collateralAmount);
      expect(userData.debt).to.equal(loanAmount);
      expect(userData.interest).to.equal(expectedInterest);
    });
  });
});
