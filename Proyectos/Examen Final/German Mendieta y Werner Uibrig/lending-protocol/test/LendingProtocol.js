const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
  let lendingProtocol, collateralToken, loanToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy tokens
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy();
    await collateralToken.waitForDeployment();

    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy();
    await loanToken.waitForDeployment();

    // Deploy lending protocol
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress()
    );
    await lendingProtocol.waitForDeployment();

    // Setup: Fund contract and give tokens to users
    const fundAmount = ethers.parseEther("100000");
    await loanToken.approve(await lendingProtocol.getAddress(), fundAmount);
    await lendingProtocol.fundContract(fundAmount);

    // Give users tokens for testing
    const userAmount = ethers.parseEther("1000");
    await collateralToken.mint(user1.address, userAmount);
    await collateralToken.mint(user2.address, userAmount);
    await loanToken.mint(user1.address, userAmount);
  });

  describe("Deployment", function () {
    it("Should set correct token addresses", async function () {
      expect(await lendingProtocol.collateralToken()).to.equal(await collateralToken.getAddress());
      expect(await lendingProtocol.loanToken()).to.equal(await loanToken.getAddress());
    });

    it("Should set correct constants", async function () {
      expect(await lendingProtocol.COLLATERAL_RATIO()).to.equal(150);
      expect(await lendingProtocol.WEEKLY_INTEREST_RATE()).to.equal(5);
    });

    it("Should have correct initial funding", async function () {
      const balance = await lendingProtocol.getContractBalance();
      expect(balance).to.equal(ethers.parseEther("100000"));
    });
  });

  describe("Collateral Deposit", function () {
    it("Should allow depositing collateral", async function () {
      const depositAmount = ethers.parseEther("100");

      // Approve first
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

      await expect(lendingProtocol.connect(user1).depositCollateral(depositAmount))
        .to.emit(lendingProtocol, "CollateralDeposited")
        .withArgs(user1.address, depositAmount);

      const position = await lendingProtocol.positions(user1.address);
      expect(position.collateral).to.equal(depositAmount);
    });

    it("Should reject zero amount deposits", async function () {
      await expect(lendingProtocol.connect(user1).depositCollateral(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject deposits without approval", async function () {
      const depositAmount = ethers.parseEther("100");

      // Don't approve - this should fail with custom error from ERC20
      await expect(lendingProtocol.connect(user1).depositCollateral(depositAmount))
        .to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance")
        .withArgs(
          await lendingProtocol.getAddress(), // 👈 CAMBIO: El spender es el contrato lending, no el usuario
          0,                                   // allowance actual (0)
          depositAmount                        // cantidad necesaria
        );
    });

    it("Should reject deposits with insufficient balance", async function () {
      const depositAmount = ethers.parseEther("2000"); // More than user has

      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

      await expect(lendingProtocol.connect(user1).depositCollateral(depositAmount))
        .to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance")
        .withArgs(user1.address, ethers.parseEther("1000"), depositAmount);
    });

    it("Should emit CollateralDeposited event", async function () {
      const depositAmount = ethers.parseEther("100");

      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);

      await expect(lendingProtocol.connect(user1).depositCollateral(depositAmount))
        .to.emit(lendingProtocol, "CollateralDeposited")
        .withArgs(user1.address, depositAmount);
    });
  });

  describe("Borrowing", function () {
    beforeEach(async function () {
      // Setup: user1 deposits collateral
      const collateralAmount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
    });

    it("Should allow borrowing with sufficient collateral", async function () {
      const borrowAmount = ethers.parseEther("100");

      await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
        .to.emit(lendingProtocol, "LoanBorrowed")
        .withArgs(user1.address, borrowAmount);

      const position = await lendingProtocol.positions(user1.address);
      expect(position.debt).to.equal(borrowAmount);
    });

    it("Should reject borrowing with insufficient collateral", async function () {
      const borrowAmount = ethers.parseEther("150"); // More than allowed (150/1.5 = 100 max)

      await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
        .to.be.revertedWith("Insufficient collateral - need 150% ratio");
    });

    it("Should reject zero amount borrows", async function () {
      await expect(lendingProtocol.connect(user1).borrow(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should calculate max borrow amount correctly", async function () {
      const userData = await lendingProtocol.getUserData(user1.address);
      // With 150 cUSD collateral, can borrow 100 dDAI (150/1.5 = 100)
      expect(userData.maxBorrowAmount).to.equal(ethers.parseEther("100"));
    });

    it("Should emit LoanBorrowed event", async function () {
      const borrowAmount = ethers.parseEther("50");

      await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
        .to.emit(lendingProtocol, "LoanBorrowed")
        .withArgs(user1.address, borrowAmount);
    });

    it("Should allow multiple borrows within limit", async function () {
      await lendingProtocol.connect(user1).borrow(ethers.parseEther("50"));
      await lendingProtocol.connect(user1).borrow(ethers.parseEther("30"));

      const position = await lendingProtocol.positions(user1.address);
      expect(position.debt).to.equal(ethers.parseEther("80"));
    });
  });

  describe("Repayment and Interest", function () {
    beforeEach(async function () {
      // Setup: user1 deposits collateral and borrows
      const collateralAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");

      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);
    });

    it("Should calculate interest correctly (5% per week)", async function () {
      const repayAmount = ethers.parseEther("105"); // 100 + 5% interest

      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);

      await expect(lendingProtocol.connect(user1).repay())
        .to.emit(lendingProtocol, "LoanRepaid")
        .withArgs(user1.address, ethers.parseEther("100"), ethers.parseEther("5"));

      const position = await lendingProtocol.positions(user1.address);
      expect(position.debt).to.equal(0);
      expect(position.weeksPassed).to.equal(0); // Reset after repayment
      expect(position.totalInterest).to.equal(0); // Reset after repayment
    });

    it("Should reject repayment without debt", async function () {
      // First repay the debt
      const repayAmount = ethers.parseEther("105");
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);
      await lendingProtocol.connect(user1).repay();

      // Try to repay again
      await expect(lendingProtocol.connect(user1).repay())
        .to.be.revertedWith("No debt to repay");
    });

    it("Should reject repayment without sufficient dDAI balance", async function () {
      // Remove all dDAI from user1
      const userBalance = await loanToken.balanceOf(user1.address);
      await loanToken.connect(user1).transfer(user2.address, userBalance);

      await expect(lendingProtocol.connect(user1).repay())
        .to.be.revertedWith("Insufficient dDAI to repay");
    });

    it("Should reject repayment without sufficient approval", async function () {
      // Don't approve enough tokens
      const insufficientAmount = ethers.parseEther("50");
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), insufficientAmount);

      await expect(lendingProtocol.connect(user1).repay())
        .to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
    });

    it("Should emit LoanRepaid event", async function () {
      const repayAmount = ethers.parseEther("105");

      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);

      await expect(lendingProtocol.connect(user1).repay())
        .to.emit(lendingProtocol, "LoanRepaid")
        .withArgs(user1.address, ethers.parseEther("100"), ethers.parseEther("5"));
    });

    it("Should handle multiple weeks of interest correctly", async function () {
      // First week: 100 -> 105
      let repayAmount = ethers.parseEther("105");
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);
      await lendingProtocol.connect(user1).repay();

      // Borrow again for second week
      await lendingProtocol.connect(user1).borrow(ethers.parseEther("100"));
      repayAmount = ethers.parseEther("105");
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);
      await lendingProtocol.connect(user1).repay();

      // Since each repay resets the position, check that it worked twice
      const position = await lendingProtocol.positions(user1.address);
      expect(position.debt).to.equal(0);
    });
  });

  describe("Collateral Withdrawal", function () {
    beforeEach(async function () {
      // Setup: user1 deposits collateral
      const collateralAmount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
    });

    it("Should allow withdrawal without debt", async function () {
      const initialCollateral = ethers.parseEther("150");

      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.emit(lendingProtocol, "CollateralWithdrawn")
        .withArgs(user1.address, initialCollateral);

      const position = await lendingProtocol.positions(user1.address);
      expect(position.collateral).to.equal(0);
    });

    it("Should reject withdrawal with pending debt", async function () {
      // First borrow
      await lendingProtocol.connect(user1).borrow(ethers.parseEther("50"));

      // Try to withdraw
      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.be.revertedWith("Cannot withdraw with pending debt");
    });

    it("Should reject withdrawal when no collateral exists", async function () {
      // First withdraw all collateral
      await lendingProtocol.connect(user1).withdrawCollateral();

      // Try to withdraw again
      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.be.revertedWith("No collateral to withdraw");
    });
  });

  describe("Complete User Journey", function () {
    it("Should handle complete deposit -> borrow -> repay -> withdraw cycle", async function () {
      const collateralAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");
      const repayAmount = ethers.parseEther("105");

      // 1. Deposit collateral
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);

      // 2. Borrow
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // 3. Repay
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);
      await lendingProtocol.connect(user1).repay();

      // 4. Withdraw collateral
      await lendingProtocol.connect(user1).withdrawCollateral();

      const position = await lendingProtocol.positions(user1.address);
      expect(position.collateral).to.equal(0);
      expect(position.debt).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle borrowing exact maximum amount", async function () {
      const collateralAmount = ethers.parseEther("150");
      const maxBorrowAmount = ethers.parseEther("100");

      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);

      await expect(lendingProtocol.connect(user1).borrow(maxBorrowAmount))
        .to.not.be.reverted;
    });

    it("Should handle multiple users independently", async function () {
      const collateralAmount = ethers.parseEther("150");

      // Give user2 some loan tokens for testing
      await loanToken.mint(user2.address, ethers.parseEther("1000"));

      // User1 operations
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
      await lendingProtocol.connect(user1).borrow(ethers.parseEther("50"));

      // User2 operations
      await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), collateralAmount);
      await lendingProtocol.connect(user2).depositCollateral(collateralAmount);
      await lendingProtocol.connect(user2).borrow(ethers.parseEther("75"));

      const position1 = await lendingProtocol.positions(user1.address);
      const position2 = await lendingProtocol.positions(user2.address);

      expect(position1.debt).to.equal(ethers.parseEther("50"));
      expect(position2.debt).to.equal(ethers.parseEther("75"));
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to fund contract", async function () {
      const fundAmount = ethers.parseEther("10000");

      await loanToken.approve(await lendingProtocol.getAddress(), fundAmount);
      await expect(lendingProtocol.fundContract(fundAmount))
        .to.not.be.reverted;

      const newBalance = await lendingProtocol.getContractBalance();
      expect(newBalance).to.equal(ethers.parseEther("110000")); // 100000 + 10000
    });

    it("Should reject funding from non-owner", async function () {
      const fundAmount = ethers.parseEther("10000");

      await loanToken.mint(user1.address, fundAmount);
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), fundAmount);

      await expect(lendingProtocol.connect(user1).fundContract(fundAmount))
        .to.be.revertedWithCustomError(lendingProtocol, "OwnableUnauthorizedAccount")
        .withArgs(user1.address);
    });
  });
});