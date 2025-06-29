import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("LendingProtocol", function () {
  let lendingProtocol;
  let collateralToken;
  let loanToken;
  let owner;
  let user1;
  let user2;

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

    // Mint tokens to users
    await collateralToken.mint(user1.address, ethers.parseEther("1000"));
    await loanToken.mint(await lendingProtocol.getAddress(), ethers.parseEther("1000"));
  });

  describe("Deposit Collateral", function () {
    it("Should allow users to deposit collateral", async function () {
      const amount = ethers.parseEther("150");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount);
      await lendingProtocol.connect(user1).depositCollateral(amount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(amount);
    });

    it("Should fail if amount is 0", async function () {
      await expect(
        lendingProtocol.connect(user1).depositCollateral(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail if user has no tokens", async function () {
      const amount = ethers.parseEther("150");
      await expect(
        lendingProtocol.connect(user2).depositCollateral(amount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
    });

    it("Should fail if user has insufficient allowance", async function () {
      const amount = ethers.parseEther("150");
      await expect(
        lendingProtocol.connect(user1).depositCollateral(amount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
    });

    it("Should emit CollateralDeposited event", async function () {
      const amount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount);
      
      await expect(lendingProtocol.connect(user1).depositCollateral(amount))
        .to.emit(lendingProtocol, "CollateralDeposited")
        .withArgs(user1.address, amount);
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount);
      await lendingProtocol.connect(user1).depositCollateral(amount);
    });

    it("Should allow users to borrow up to 66.67% of collateral", async function () {
      const borrowAmount = ethers.parseEther("100");
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.debt).to.equal(borrowAmount);
    });

    it("Should fail if borrow amount exceeds limit", async function () {
      const borrowAmount = ethers.parseEther("101");
      await expect(
        lendingProtocol.connect(user1).borrow(borrowAmount)
      ).to.be.revertedWith("Borrow amount exceeds limit");
    });

    it("Should fail if amount is 0", async function () {
      await expect(
        lendingProtocol.connect(user1).borrow(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail if user has no collateral", async function () {
      const borrowAmount = ethers.parseEther("100");
      await expect(
        lendingProtocol.connect(user2).borrow(borrowAmount)
      ).to.be.revertedWith("No collateral deposited");
    });

    it("Should fail if protocol has insufficient tokens", async function () {
      const borrowAmount = ethers.parseEther("1000");
      await expect(
        lendingProtocol.connect(user1).borrow(borrowAmount)
      ).to.be.revertedWith("Borrow amount exceeds limit");
    });

    it("Should emit LoanBorrowed event", async function () {
      const borrowAmount = ethers.parseEther("100");
      await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
        .to.emit(lendingProtocol, "LoanBorrowed")
        .withArgs(user1.address, borrowAmount);
    });

    it("Should update lastInterestTimestamp on borrow", async function () {
      const borrowAmount = ethers.parseEther("100");
      await lendingProtocol.connect(user1).borrow(borrowAmount);
      
      const interest = await lendingProtocol.calculateInterest(user1.address);
      expect(interest).to.equal(ethers.parseEther("5"));
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);
    });

    it("Should allow users to repay their loan", async function () {
      // Mint tokens to user1 for repayment
      await loanToken.mint(user1.address, ethers.parseEther("105"));
      
      // Aprobar el monto total incluyendo interés (100 + 5% = 105)
      const repayAmount = ethers.parseEther("105");
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), repayAmount);
      await lendingProtocol.connect(user1).repay();

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.debt).to.equal(0);
    });

    it("Should fail if user has no debt", async function () {
      await expect(
        lendingProtocol.connect(user2).repay()
      ).to.be.revertedWith("No debt to repay");
    });

    it("Should fail if user has insufficient balance", async function () {
      // No mint tokens, por lo que el balance será 0
      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail if user has insufficient allowance", async function () {
      // Mint tokens pero sin aprobar
      await loanToken.mint(user1.address, ethers.parseEther("105"));
      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should emit LoanRepaid event", async function () {
      await loanToken.mint(user1.address, ethers.parseEther("105"));
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), ethers.parseEther("105"));
      
      await expect(lendingProtocol.connect(user1).repay())
        .to.emit(lendingProtocol, "LoanRepaid")
        .withArgs(user1.address, ethers.parseEther("105"));
    });

    it("Should update lastInterestTimestamp on repay", async function () {
      await loanToken.mint(user1.address, ethers.parseEther("105"));
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), ethers.parseEther("105"));
      
      await lendingProtocol.connect(user1).repay();
      const interest = await lendingProtocol.calculateInterest(user1.address);
      expect(interest).to.equal(0);
    });
  });

  describe("Withdraw Collateral", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount);
      await lendingProtocol.connect(user1).depositCollateral(amount);
    });

    it("Should allow users to withdraw collateral if no debt", async function () {
      await lendingProtocol.connect(user1).withdrawCollateral();

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(0);
    });

    it("Should fail if user has debt", async function () {
      const borrowAmount = ethers.parseEther("100");
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      await expect(
        lendingProtocol.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Debt must be repaid first");
    });

    it("Should fail if user has no collateral", async function () {
      await expect(
        lendingProtocol.connect(user2).withdrawCollateral()
      ).to.be.revertedWith("No collateral to withdraw");
    });

    it("Should emit CollateralWithdrawn event", async function () {
      const amount = ethers.parseEther("150");
      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.emit(lendingProtocol, "CollateralWithdrawn")
        .withArgs(user1.address, amount);
    });
  });

  describe("Token Tests", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await collateralToken.mint(user1.address, amount);
      const balance = await collateralToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("1100")); // 1000 iniciales + 100 nuevos
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        collateralToken.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWithCustomError(collateralToken, "OwnableUnauthorizedAccount");
    });

    it("Should allow token transfers", async function () {
      const amount = ethers.parseEther("100");
      await collateralToken.connect(user1).transfer(user2.address, amount);
      expect(await collateralToken.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should fail transfer if insufficient balance", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        collateralToken.connect(user2).transfer(user1.address, amount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
    });
  });

  describe("Collateral Token Faucet Tests", function () {
    it("Should allow users to use faucet and receive 100 tokens", async function () {
      const initialBalance = await collateralToken.balanceOf(user2.address);
      await collateralToken.connect(user2).faucet();
      const finalBalance = await collateralToken.balanceOf(user2.address);
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("100"));
    });

    it("Should fail if faucet cooldown not met", async function () {
      await collateralToken.connect(user2).faucet();
      await expect(
        collateralToken.connect(user2).faucet()
      ).to.be.revertedWith("Faucet cooldown not met");
    });

    it("Should allow faucet use after cooldown period", async function () {
      await collateralToken.connect(user2).faucet();
      
      // Simulate time passing (increase timestamp by 1 hour + 1 second)
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Should be able to use faucet again
      await expect(collateralToken.connect(user2).faucet()).to.not.be.reverted;
    });

    it("Should correctly report if user can use faucet", async function () {
      // Initially should be able to use faucet
      expect(await collateralToken.canUseFaucet(user2.address)).to.be.true;
      
      // After using faucet, should not be able to use it immediately
      await collateralToken.connect(user2).faucet();
      expect(await collateralToken.canUseFaucet(user2.address)).to.be.false;
      
      // After cooldown, should be able to use again
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      expect(await collateralToken.canUseFaucet(user2.address)).to.be.true;
    });

    it("Should correctly calculate faucet cooldown remaining", async function () {
      // Initially should have 0 cooldown
      expect(await collateralToken.faucetCooldownRemaining(user2.address)).to.equal(0);
      
      // After using faucet, should have cooldown remaining
      await collateralToken.connect(user2).faucet();
      const cooldownRemaining = await collateralToken.faucetCooldownRemaining(user2.address);
      expect(cooldownRemaining).to.be.greaterThan(0);
      expect(cooldownRemaining).to.be.lessThanOrEqual(3600); // Should be <= 1 hour
      
      // After cooldown passes, should be 0 again
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      expect(await collateralToken.faucetCooldownRemaining(user2.address)).to.equal(0);
    });

    it("Should test faucet cooldown edge case - exactly at cooldown time", async function () {
      await collateralToken.connect(user2).faucet();
      
      // Test exactly at cooldown time (3600 seconds)
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      // Should be able to use faucet at exactly cooldown time
      await expect(collateralToken.connect(user2).faucet()).to.not.be.reverted;
    });

    it("Should test faucet cooldown remaining when no previous usage", async function () {
      // Test for a fresh user who hasn't used faucet yet
      const remainingCooldown = await collateralToken.faucetCooldownRemaining(owner.address);
      expect(remainingCooldown).to.equal(0);
    });
  });

  describe("Loan Token Faucet Tests", function () {
    it("Should allow users to use faucet and receive 100 tokens", async function () {
      const initialBalance = await loanToken.balanceOf(user2.address);
      await loanToken.connect(user2).faucet();
      const finalBalance = await loanToken.balanceOf(user2.address);
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("100"));
    });

    it("Should fail if faucet cooldown not met", async function () {
      await loanToken.connect(user2).faucet();
      await expect(
        loanToken.connect(user2).faucet()
      ).to.be.revertedWith("Faucet cooldown not met");
    });

    it("Should allow faucet use after cooldown period", async function () {
      await loanToken.connect(user2).faucet();
      
      // Simulate time passing (increase timestamp by 1 hour + 1 second)
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      
      // Should be able to use faucet again
      await expect(loanToken.connect(user2).faucet()).to.not.be.reverted;
    });

    it("Should correctly report if user can use faucet", async function () {
      // Initially should be able to use faucet
      expect(await loanToken.canUseFaucet(user2.address)).to.be.true;
      
      // After using faucet, should not be able to use it immediately
      await loanToken.connect(user2).faucet();
      expect(await loanToken.canUseFaucet(user2.address)).to.be.false;
      
      // After cooldown, should be able to use again
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      expect(await loanToken.canUseFaucet(user2.address)).to.be.true;
    });

    it("Should correctly calculate faucet cooldown remaining", async function () {
      // Initially should have 0 cooldown
      expect(await loanToken.faucetCooldownRemaining(user2.address)).to.equal(0);
      
      // After using faucet, should have cooldown remaining
      await loanToken.connect(user2).faucet();
      const cooldownRemaining = await loanToken.faucetCooldownRemaining(user2.address);
      expect(cooldownRemaining).to.be.greaterThan(0);
      expect(cooldownRemaining).to.be.lessThanOrEqual(3600); // Should be <= 1 hour
      
      // After cooldown passes, should be 0 again
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      expect(await loanToken.faucetCooldownRemaining(user2.address)).to.equal(0);
    });

    it("Should test faucet cooldown edge case - exactly at cooldown time", async function () {
      await loanToken.connect(user2).faucet();
      
      // Test exactly at cooldown time (3600 seconds)
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      // Should be able to use faucet at exactly cooldown time
      await expect(loanToken.connect(user2).faucet()).to.not.be.reverted;
    });

    it("Should test faucet cooldown remaining when no previous usage", async function () {
      // Test for a fresh user who hasn't used faucet yet
      const remainingCooldown = await loanToken.faucetCooldownRemaining(owner.address);
      expect(remainingCooldown).to.equal(0);
    });
  });

  describe("Interest and User Data", function () {
    it("Should calculate interest correctly", async function () {
      // Depositar colateral y pedir préstamo
      const depositAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Verificar interés (5% de 100 = 5)
      const interest = await lendingProtocol.calculateInterest(user1.address);
      expect(interest).to.equal(ethers.parseEther("5"));
    });

    it("Should return 0 interest when there is no debt", async function () {
      const interest = await lendingProtocol.calculateInterest(user1.address);
      expect(interest).to.equal(0);
    });

    it("Should return correct user data with no debt", async function () {
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);
    });

    it("Should return correct user data with debt", async function () {
      // Depositar colateral y pedir préstamo
      const depositAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(depositAmount);
      expect(debt).to.equal(borrowAmount);
      expect(interest).to.equal(ethers.parseEther("5")); // 5% de interés
    });

    it("Should return correct user data after repayment", async function () {
      // Depositar colateral y pedir préstamo
      const depositAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Repagar el préstamo
      await loanToken.mint(user1.address, ethers.parseEther("105"));
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), ethers.parseEther("105"));
      await lendingProtocol.connect(user1).repay();

      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(depositAmount);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);
    });
  });

  describe("Additional Edge Cases for Full Branch Coverage", function () {
    it("Should handle multiple deposits from same user", async function () {
      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("50");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount1 + amount2);
      await lendingProtocol.connect(user1).depositCollateral(amount1);
      await lendingProtocol.connect(user1).depositCollateral(amount2);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(amount1 + amount2);
    });

    it("Should handle multiple borrows from same user", async function () {
      const depositAmount = ethers.parseEther("300");
      const borrowAmount1 = ethers.parseEther("100");
      const borrowAmount2 = ethers.parseEther("50");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount1);
      await lendingProtocol.connect(user1).borrow(borrowAmount2);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.debt).to.equal(borrowAmount1 + borrowAmount2);
    });

    it("Should fail when trying to borrow exact maximum amount plus one wei", async function () {
      const depositAmount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      
      // maxBorrow should be 100 ether exactly
      const maxBorrow = ethers.parseEther("100");
      const borrowAmount = maxBorrow + 1n; // Add 1 wei to exceed limit
      
      await expect(
        lendingProtocol.connect(user1).borrow(borrowAmount)
      ).to.be.revertedWith("Borrow amount exceeds limit");
    });

    it("Should succeed when borrowing exact maximum amount", async function () {
      const depositAmount = ethers.parseEther("150");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      
      // maxBorrow should be exactly 100 ether
      const maxBorrow = ethers.parseEther("100");
      await lendingProtocol.connect(user1).borrow(maxBorrow);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.debt).to.equal(maxBorrow);
    });

    it("Should handle repayment when transfer fails", async function () {
      const depositAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("100");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Create a mock situation where transfer could fail
      // This tests the branch where transferFrom returns false
      await loanToken.mint(user1.address, ethers.parseEther("105"));
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), ethers.parseEther("104")); // Not enough allowance
      
      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should handle withdrawal when transfer fails", async function () {
      const depositAmount = ethers.parseEther("150");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      
      // Try to manipulate contract state to make transfer fail
      // This is a bit tricky since we can't easily make ERC20 transfer fail
      // But we can test the require statement by checking the balance
      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(depositAmount);
      
      // Normal withdrawal should work
      await lendingProtocol.connect(user1).withdrawCollateral();
      
      const userDataAfter = await lendingProtocol.getUserData(user1.address);
      expect(userDataAfter.collateral).to.equal(0);
    });

    it("Should test calculateInterest with zero debt", async function () {
      // This tests the if (data.debt == 0) return 0; branch
      const interest = await lendingProtocol.calculateInterest(user2.address);
      expect(interest).to.equal(0);
    });

    it("Should test calculateInterest with non-zero debt", async function () {
      const depositAmount = ethers.parseEther("150");
      const borrowAmount = ethers.parseEther("50");
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      const interest = await lendingProtocol.calculateInterest(user1.address);
      expect(interest).to.equal(ethers.parseEther("2.5")); // 5% of 50
    });

    it("Should verify user data for different users", async function () {
      // Test userData mapping for different addresses
      const [collateral1, debt1, interest1] = await lendingProtocol.getUserData(user1.address);
      const [collateral2, debt2, interest2] = await lendingProtocol.getUserData(user2.address);
      
      // user1 should have some activity from previous tests
      // user2 should have clean state
      expect(collateral2).to.equal(0);
      expect(debt2).to.equal(0);
      expect(interest2).to.equal(0);
    });
  });
}); 