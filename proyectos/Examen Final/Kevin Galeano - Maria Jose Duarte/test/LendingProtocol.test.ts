import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import {
  CollateralToken,
  LoanToken,
  LendingProtocol,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingProtocol", function () {
  async function deployLendingProtocolFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy tokens
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const collateralToken = await CollateralToken.deploy(owner.address);

    const LoanToken = await ethers.getContractFactory("LoanToken");
    const loanToken = await LoanToken.deploy(owner.address);

    // Deploy protocol
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    const lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress(),
      owner.address
    );

    // Fund protocol with loan tokens
    const fundAmount = ethers.parseEther("100000");
    await loanToken.approve(await lendingProtocol.getAddress(), fundAmount);
    await lendingProtocol.fundContract(fundAmount);

    // Give users some tokens for testing
    const userAmount = ethers.parseEther("10000");
    await collateralToken.transfer(user1.address, userAmount);
    await collateralToken.transfer(user2.address, userAmount);
    await loanToken.transfer(user1.address, userAmount);
    await loanToken.transfer(user2.address, userAmount);

    return {
      collateralToken,
      loanToken,
      lendingProtocol,
      owner,
      user1,
      user2,
      fundAmount,
      userAmount,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      const { collateralToken, loanToken, lendingProtocol } = await loadFixture(
        deployLendingProtocolFixture
      );

      expect(await lendingProtocol.collateralToken()).to.equal(
        await collateralToken.getAddress()
      );
      expect(await lendingProtocol.loanToken()).to.equal(
        await loanToken.getAddress()
      );
    });

    it("Should set the correct constants", async function () {
      const { lendingProtocol } = await loadFixture(
        deployLendingProtocolFixture
      );

      expect(await lendingProtocol.COLLATERALIZATION_RATIO()).to.equal(150);
      expect(await lendingProtocol.INTEREST_RATE()).to.equal(5);
      expect(await lendingProtocol.PRECISION()).to.equal(100);
    });
  });

  describe("Deposit Collateral", function () {
    it("Should allow user to deposit collateral", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1000");
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);

      await expect(
        lendingProtocol.connect(user1).depositCollateral(depositAmount)
      )
        .to.emit(lendingProtocol, "CollateralDeposited")
        .withArgs(user1.address, depositAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(depositAmount);
    });

    it("Should reject zero amount deposits", async function () {
      const { lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      await expect(
        lendingProtocol.connect(user1).depositCollateral(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject deposits without approval", async function () {
      const { lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1000");
      await expect(
        lendingProtocol.connect(user1).depositCollateral(depositAmount)
      ).to.be.reverted;
    });

    it("Should accumulate multiple deposits", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const firstDeposit = ethers.parseEther("500");
      const secondDeposit = ethers.parseEther("300");

      await collateralToken
        .connect(user1)
        .approve(
          await lendingProtocol.getAddress(),
          firstDeposit + secondDeposit
        );

      await lendingProtocol.connect(user1).depositCollateral(firstDeposit);
      await lendingProtocol.connect(user1).depositCollateral(secondDeposit);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(firstDeposit + secondDeposit);
    });
  });

  describe("Borrow", function () {
    it("Should allow borrowing against collateral", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000"); // 66.67% of collateral

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);

      await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
        .to.emit(lendingProtocol, "LoanBorrowed")
        .withArgs(user1.address, borrowAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.debt).to.equal(borrowAmount);
    });

    it("Should reject borrowing without collateral", async function () {
      const { lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      await expect(
        lendingProtocol.connect(user1).borrow(ethers.parseEther("100"))
      ).to.be.revertedWith("No collateral deposited");
    });

    it("Should reject borrowing zero amount", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), ethers.parseEther("1000"));
      await lendingProtocol
        .connect(user1)
        .depositCollateral(ethers.parseEther("1000"));

      await expect(lendingProtocol.connect(user1).borrow(0)).to.be.revertedWith(
        "Amount must be greater than 0"
      );
    });

    it("Should reject over-borrowing", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1000");
      const overBorrowAmount = ethers.parseEther("700"); // More than 66.67%

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);

      await expect(
        lendingProtocol.connect(user1).borrow(overBorrowAmount)
      ).to.be.revertedWith("Exceeds borrowing capacity");
    });

    it("Should calculate maximum borrowable amount correctly", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const maxBorrowAmount = ethers.parseEther("1000"); // 1500 * 100 / 150 = 1000

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);

      await expect(lendingProtocol.connect(user1).borrow(maxBorrowAmount)).to
        .not.be.reverted;
    });
  });

  describe("Interest Calculation", function () {
    it("Should calculate interest correctly after time passes", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Advance time by 1 week
      await time.increase(7 * 24 * 60 * 60);

      const userData = await lendingProtocol.getUserData(user1.address);
      const expectedInterest = (borrowAmount * 5n) / 100n; // 5% of 1000 = 50
      expect(userData.interest).to.equal(expectedInterest);
    });

    it("Should accumulate interest over multiple weeks", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Advance time by 2 weeks
      await time.increase(14 * 24 * 60 * 60);

      const userData = await lendingProtocol.getUserData(user1.address);
      const expectedInterest = (borrowAmount * 10n) / 100n; // 5% * 2 weeks = 10%
      expect(userData.interest).to.equal(expectedInterest);
    });

    it("Should not calculate interest for partial weeks", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Advance time by 3 days (less than a week)
      await time.increase(3 * 24 * 60 * 60);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.interest).to.equal(0);
    });
  });

  describe("Repay", function () {
    it("Should allow full repayment of loan with interest", async function () {
      const { collateralToken, loanToken, lendingProtocol, user1 } =
        await loadFixture(deployLendingProtocolFixture);

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Advance time by 1 week
      await time.increase(7 * 24 * 60 * 60);

      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData.debt + userData.interest;

      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);

      await expect(lendingProtocol.connect(user1).repay())
        .to.emit(lendingProtocol, "LoanRepaid")
        .withArgs(user1.address, borrowAmount, userData.interest);

      const newUserData = await lendingProtocol.getUserData(user1.address);
      expect(newUserData.debt).to.equal(0);
      expect(newUserData.interest).to.equal(0);
    });

    it("Should reject repayment without active loan", async function () {
      const { lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      await expect(lendingProtocol.connect(user1).repay()).to.be.revertedWith(
        "No active loan"
      );
    });

    it("Should reject repayment without sufficient tokens", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Don't approve enough tokens for repayment
      await expect(lendingProtocol.connect(user1).repay()).to.be.reverted;
    });
  });

  describe("Withdraw Collateral", function () {
    it("Should allow withdrawal when no debt exists", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);

      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.emit(lendingProtocol, "CollateralWithdrawn")
        .withArgs(user1.address, depositAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData.collateral).to.equal(0);
    });

    it("Should reject withdrawal with active debt", async function () {
      const { collateralToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      await expect(
        lendingProtocol.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Cannot withdraw with active debt");
    });

    it("Should reject withdrawal with no collateral", async function () {
      const { lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      await expect(
        lendingProtocol.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("No collateral to withdraw");
    });

    it("Should allow withdrawal after loan repayment", async function () {
      const { collateralToken, loanToken, lendingProtocol, user1 } =
        await loadFixture(deployLendingProtocolFixture);

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      // Deposit and borrow
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      await lendingProtocol.connect(user1).borrow(borrowAmount);

      // Advance time and repay
      await time.increase(7 * 24 * 60 * 60);
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData.debt + userData.interest;

      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();

      // Should now be able to withdraw
      await expect(lendingProtocol.connect(user1).withdrawCollateral()).to.not
        .be.reverted;
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to fund contract", async function () {
      const { loanToken, lendingProtocol, owner } = await loadFixture(
        deployLendingProtocolFixture
      );

      const additionalFunding = ethers.parseEther("50000");
      await loanToken.approve(
        await lendingProtocol.getAddress(),
        additionalFunding
      );

      await expect(lendingProtocol.fundContract(additionalFunding)).to.not.be
        .reverted;
    });

    it("Should allow owner to withdraw excess", async function () {
      const { lendingProtocol, owner } = await loadFixture(
        deployLendingProtocolFixture
      );

      const withdrawAmount = ethers.parseEther("10000");

      await expect(lendingProtocol.withdrawExcess(withdrawAmount)).to.not.be
        .reverted;
    });

    it("Should reject non-owner funding", async function () {
      const { loanToken, lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      const amount = ethers.parseEther("1000");
      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), amount);

      await expect(
        lendingProtocol.connect(user1).fundContract(amount)
      ).to.be.revertedWithCustomError(
        lendingProtocol,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should reject non-owner withdrawal", async function () {
      const { lendingProtocol, user1 } = await loadFixture(
        deployLendingProtocolFixture
      );

      await expect(
        lendingProtocol.connect(user1).withdrawExcess(ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(
        lendingProtocol,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users independently", async function () {
      const { collateralToken, lendingProtocol, user1, user2 } =
        await loadFixture(deployLendingProtocolFixture);

      const depositAmount1 = ethers.parseEther("1000");
      const depositAmount2 = ethers.parseEther("2000");

      // User1 deposits
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount1);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount1);

      // User2 deposits
      await collateralToken
        .connect(user2)
        .approve(await lendingProtocol.getAddress(), depositAmount2);
      await lendingProtocol.connect(user2).depositCollateral(depositAmount2);

      const userData1 = await lendingProtocol.getUserData(user1.address);
      const userData2 = await lendingProtocol.getUserData(user2.address);

      expect(userData1.collateral).to.equal(depositAmount1);
      expect(userData2.collateral).to.equal(depositAmount2);
    });

    it("Should reject borrowing when contract has insufficient funds", async function () {
      const { collateralToken, lendingProtocol, owner, user1 } =
        await loadFixture(deployLendingProtocolFixture);

      // Withdraw ALL funds from contract
      const loanTokenAddress = await lendingProtocol.loanToken();
      const loanToken = await ethers.getContractAt(
        "LoanToken",
        loanTokenAddress
      );
      const contractBalance = await loanToken.balanceOf(
        await lendingProtocol.getAddress()
      );
      await lendingProtocol.withdrawExcess(contractBalance);

      const depositAmount = ethers.parseEther("1500");
      const borrowAmount = ethers.parseEther("1000");

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);

      await expect(
        lendingProtocol.connect(user1).borrow(borrowAmount)
      ).to.be.revertedWith("Insufficient loan tokens in contract");
    });
  });
});

describe("Token Contracts", function () {
  async function deployTokenFixture() {
    const [owner, user1] = await ethers.getSigners();

    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const collateralToken = await CollateralToken.deploy(owner.address);

    const LoanToken = await ethers.getContractFactory("LoanToken");
    const loanToken = await LoanToken.deploy(owner.address);

    return { collateralToken, loanToken, owner, user1 };
  }

  describe("CollateralToken", function () {
    it("Should have correct name and symbol", async function () {
      const { collateralToken } = await loadFixture(deployTokenFixture);

      expect(await collateralToken.name()).to.equal("Collateral USD");
      expect(await collateralToken.symbol()).to.equal("cUSD");
      expect(await collateralToken.decimals()).to.equal(18);
    });

    it("Should allow owner to mint tokens", async function () {
      const { collateralToken, owner, user1 } = await loadFixture(
        deployTokenFixture
      );

      const mintAmount = ethers.parseEther("1000");
      await collateralToken.mint(user1.address, mintAmount);

      expect(await collateralToken.balanceOf(user1.address)).to.equal(
        mintAmount
      );
    });

    it("Should reject non-owner minting", async function () {
      const { collateralToken, user1 } = await loadFixture(deployTokenFixture);

      await expect(
        collateralToken
          .connect(user1)
          .mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(
        collateralToken,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("LoanToken", function () {
    it("Should have correct name and symbol", async function () {
      const { loanToken } = await loadFixture(deployTokenFixture);

      expect(await loanToken.name()).to.equal("Decentralized DAI");
      expect(await loanToken.symbol()).to.equal("dDAI");
      expect(await loanToken.decimals()).to.equal(18);
    });

    it("Should allow owner to mint tokens", async function () {
      const { loanToken, owner, user1 } = await loadFixture(deployTokenFixture);

      const mintAmount = ethers.parseEther("1000");
      await loanToken.mint(user1.address, mintAmount);

      expect(await loanToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should reject non-owner minting", async function () {
      const { loanToken, user1 } = await loadFixture(deployTokenFixture);

      await expect(
        loanToken.connect(user1).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
    });
  });
});
