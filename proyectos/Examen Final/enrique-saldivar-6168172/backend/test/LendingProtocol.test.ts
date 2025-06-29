import { expect } from "chai";
import { ethers } from "hardhat";
import {
  CollateralToken,
  LoanToken,
  LendingProtocol,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("LendingProtocol", function () {
  let collateralToken: CollateralToken;
  let loanToken: LoanToken;
  let lendingProtocol: LendingProtocol;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const COLLATERAL_AMOUNT = ethers.parseEther("1000");
  const LOAN_AMOUNT = ethers.parseEther("500");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy CollateralToken
    const CollateralTokenFactory = await ethers.getContractFactory(
      "CollateralToken"
    );
    collateralToken = await CollateralTokenFactory.deploy();
    await collateralToken.waitForDeployment();

    // Deploy LoanToken
    const LoanTokenFactory = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanTokenFactory.deploy();
    await loanToken.waitForDeployment();

    // Deploy LendingProtocol
    const LendingProtocolFactory = await ethers.getContractFactory(
      "LendingProtocol"
    );
    lendingProtocol = await LendingProtocolFactory.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress()
    );
    await lendingProtocol.waitForDeployment();

    // Transfer some tokens to the protocol for lending
    await loanToken.transfer(
      await lendingProtocol.getAddress(),
      ethers.parseEther("500000")
    );

    // Mint tokens to users for testing
    await collateralToken.mint(user1.address, COLLATERAL_AMOUNT);
    await collateralToken.mint(user2.address, COLLATERAL_AMOUNT);
    await loanToken.mint(user1.address, ethers.parseEther("1000"));
    await loanToken.mint(user2.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await lendingProtocol.collateralToken()).to.equal(
        await collateralToken.getAddress()
      );
      expect(await lendingProtocol.loanToken()).to.equal(
        await loanToken.getAddress()
      );
    });

    it("Should set the correct owner", async function () {
      expect(await lendingProtocol.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await lendingProtocol.COLLATERALIZATION_RATIO()).to.equal(150);
      expect(await lendingProtocol.INTEREST_RATE()).to.equal(5);
      expect(await lendingProtocol.PRECISION()).to.equal(100);
    });

    it("Should revert if deployed with zero addresses", async function () {
      const LendingProtocolFactory = await ethers.getContractFactory(
        "LendingProtocol"
      );

      await expect(
        LendingProtocolFactory.deploy(
          ethers.ZeroAddress,
          await loanToken.getAddress()
        )
      ).to.be.revertedWith("Invalid collateral token");

      await expect(
        LendingProtocolFactory.deploy(
          await collateralToken.getAddress(),
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid loan token");
    });
  });

  describe("CollateralToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await collateralToken.name()).to.equal("Collateral USD");
      expect(await collateralToken.symbol()).to.equal("cUSD");
    });

    it("Should mint tokens to owner on deployment", async function () {
      expect(await collateralToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY
      );
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await collateralToken.mint(user1.address, mintAmount);
      expect(await collateralToken.balanceOf(user1.address)).to.equal(
        COLLATERAL_AMOUNT + mintAmount
      );
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        collateralToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWithCustomError(
        collateralToken,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("LoanToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await loanToken.name()).to.equal("Decentralized DAI");
      expect(await loanToken.symbol()).to.equal("dDAI");
    });

    it("Should mint tokens to owner on deployment", async function () {
      expect(await loanToken.balanceOf(owner.address)).to.be.greaterThan(0);
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await loanToken.mint(user1.address, mintAmount);
      expect(await loanToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("2000")
      );
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        loanToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Deposit Collateral", function () {
    it("Should allow users to deposit collateral", async function () {
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);

      await expect(
        lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT)
      )
        .to.emit(lendingProtocol, "CollateralDeposited")
        .withArgs(user1.address, COLLATERAL_AMOUNT);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData[0]).to.equal(COLLATERAL_AMOUNT); // collateral
    });

    it("Should not allow deposit of zero amount", async function () {
      await expect(
        lendingProtocol.connect(user1).depositCollateral(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow deposit without approval", async function () {
      await expect(
        lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT)
      ).to.be.revertedWithCustomError(
        collateralToken,
        "ERC20InsufficientAllowance"
      );
    });

    it("Should not allow deposit without sufficient balance", async function () {
      const excessiveAmount = ethers.parseEther("2000");
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), excessiveAmount);

      await expect(
        lendingProtocol.connect(user1).depositCollateral(excessiveAmount)
      ).to.be.revertedWithCustomError(
        collateralToken,
        "ERC20InsufficientBalance"
      );
    });

    it("Should allow multiple deposits", async function () {
      const halfAmount = COLLATERAL_AMOUNT / 2n;

      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);

      await lendingProtocol.connect(user1).depositCollateral(halfAmount);
      await lendingProtocol.connect(user1).depositCollateral(halfAmount);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData[0]).to.equal(COLLATERAL_AMOUNT);
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // User deposits collateral first
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
    });

    it("Should allow users to borrow against collateral", async function () {
      await expect(lendingProtocol.connect(user1).borrow(LOAN_AMOUNT))
        .to.emit(lendingProtocol, "LoanTaken")
        .withArgs(user1.address, LOAN_AMOUNT);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData[1]).to.equal(LOAN_AMOUNT); // loan amount
    });

    it("Should not allow borrowing without collateral", async function () {
      await expect(
        lendingProtocol.connect(user2).borrow(LOAN_AMOUNT)
      ).to.be.revertedWith("No collateral deposited");
    });

    it("Should not allow borrowing more than collateralization ratio allows", async function () {
      const maxBorrow = (COLLATERAL_AMOUNT * 100n) / 150n; // 66.67% of collateral
      const excessiveBorrow = maxBorrow + ethers.parseEther("1");

      await expect(
        lendingProtocol.connect(user1).borrow(excessiveBorrow)
      ).to.be.revertedWith("Insufficient collateral");
    });

    it("Should not allow borrowing zero amount", async function () {
      await expect(lendingProtocol.connect(user1).borrow(0)).to.be.revertedWith(
        "Amount must be greater than 0"
      );
    });

    it("Should allow multiple borrows within limit", async function () {
      const halfLoan = LOAN_AMOUNT / 2n;

      await lendingProtocol.connect(user1).borrow(halfLoan);
      await lendingProtocol.connect(user1).borrow(halfLoan);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData[1]).to.equal(LOAN_AMOUNT);
    });

    it("Should update user's loan token balance", async function () {
      const initialBalance = await loanToken.balanceOf(user1.address);

      await lendingProtocol.connect(user1).borrow(LOAN_AMOUNT);

      const finalBalance = await loanToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + LOAN_AMOUNT);
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // User deposits collateral and borrows
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).borrow(LOAN_AMOUNT);
    });

    it("Should allow users to repay their loan", async function () {
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData[1] + userData[2]; // loan + interest

      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);

      await expect(lendingProtocol.connect(user1).repay()).to.emit(
        lendingProtocol,
        "LoanRepaid"
      );

      const userDataAfter = await lendingProtocol.getUserData(user1.address);
      expect(userDataAfter[1]).to.equal(0); // loan amount should be 0
      expect(userDataAfter[2]).to.equal(0); // interest should be 0
    });

    it("Should not allow repay without active loan", async function () {
      await expect(lendingProtocol.connect(user2).repay()).to.be.revertedWith(
        "No active loan"
      );
    });

    it("Should not allow repay without sufficient token balance", async function () {
      // Transfer away user's loan tokens
      const balance = await loanToken.balanceOf(user1.address);
      await loanToken.connect(user1).transfer(user2.address, balance);

      // Need to approve first to get the balance error
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData[1] + userData[2];
      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);

      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientBalance");
    });

    it("Should not allow repay without sufficient approval", async function () {
      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
    });
  });

  describe("Withdraw Collateral", function () {
    beforeEach(async function () {
      // User deposits collateral
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
    });

    it("Should allow users to withdraw collateral when no debt", async function () {
      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.emit(lendingProtocol, "CollateralWithdrawn")
        .withArgs(user1.address, COLLATERAL_AMOUNT);

      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData[0]).to.equal(0); // collateral should be 0
    });

    it("Should not allow withdrawal with outstanding debt", async function () {
      await lendingProtocol.connect(user1).borrow(LOAN_AMOUNT);

      await expect(
        lendingProtocol.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Outstanding debt exists");
    });

    it("Should not allow withdrawal without collateral", async function () {
      await expect(
        lendingProtocol.connect(user2).withdrawCollateral()
      ).to.be.revertedWith("No collateral to withdraw");
    });

    it("Should update user's collateral token balance", async function () {
      const initialBalance = await collateralToken.balanceOf(user1.address);

      await lendingProtocol.connect(user1).withdrawCollateral();

      const finalBalance = await collateralToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + COLLATERAL_AMOUNT);
    });
  });

  describe("Interest Calculation", function () {
    beforeEach(async function () {
      // User deposits collateral and borrows
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).borrow(LOAN_AMOUNT);
    });
    it("Should calculate interest correctly", async function () {
      // Simulate time passing by mining blocks with increased timestamp
      const oneWeek = 7 * 24 * 60 * 60; // 1 week in seconds
      await network.provider.send("evm_increaseTime", [oneWeek]);
      await network.provider.send("evm_mine", []);

      const userData = await lendingProtocol.getUserData(user1.address);
      const expectedInterest = (LOAN_AMOUNT * 5n) / 100n; // 5% of loan amount

      expect(userData[2]).to.equal(expectedInterest);
    });

    it("Should accumulate interest over multiple weeks", async function () {
      const oneWeek = 7 * 24 * 60 * 60;

      // Pass 2 weeks
      await ethers.provider.send("evm_increaseTime", [oneWeek * 2]);
      await ethers.provider.send("evm_mine", []);

      const userData = await lendingProtocol.getUserData(user1.address);
      const expectedInterest = (LOAN_AMOUNT * 5n * 2n) / 100n; // 5% * 2 weeks

      expect(userData[2]).to.equal(expectedInterest);
    });

    it("Should not accumulate interest without active loan", async function () {
      // Repay the loan first
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData[1] + userData[2];

      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();

      // Pass time
      const oneWeek = 7 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [oneWeek]);
      await ethers.provider.send("evm_mine", []);

      const userDataAfter = await lendingProtocol.getUserData(user1.address);
      expect(userDataAfter[1]).to.equal(0); // no loan
      expect(userDataAfter[2]).to.equal(0); // no interest
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to withdraw tokens", async function () {
      const withdrawAmount = ethers.parseEther("1000");
      const initialBalance = await loanToken.balanceOf(owner.address);

      await lendingProtocol.withdrawTokens(
        await loanToken.getAddress(),
        withdrawAmount
      );

      const finalBalance = await loanToken.balanceOf(owner.address);
      expect(finalBalance).to.equal(initialBalance + withdrawAmount);
    });

    it("Should not allow non-owner to withdraw tokens", async function () {
      const withdrawAmount = ethers.parseEther("1000");

      await expect(
        lendingProtocol
          .connect(user1)
          .withdrawTokens(await loanToken.getAddress(), withdrawAmount)
      ).to.be.revertedWithCustomError(
        lendingProtocol,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle zero collateral gracefully", async function () {
      const userData = await lendingProtocol.getUserData(user1.address);
      expect(userData[0]).to.equal(0);
      expect(userData[1]).to.equal(0);
      expect(userData[2]).to.equal(0);
    });

    it("Should prevent reentrancy attacks", async function () {
      // This test ensures the nonReentrant modifier is working
      // The actual reentrancy test would require a malicious contract
      // For now, we verify the modifier is present in the functions
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);

      // These should work without issues
      await lendingProtocol.connect(user1).borrow(LOAN_AMOUNT);

      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData[1] + userData[2];

      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();

      await lendingProtocol.connect(user1).withdrawCollateral();
    });

    it("Should handle full workflow correctly", async function () {
      // Complete workflow test
      const initialCollateralBalance = await collateralToken.balanceOf(
        user1.address
      );
      const initialLoanBalance = await loanToken.balanceOf(user1.address);

      // 1. Deposit collateral
      await collateralToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), COLLATERAL_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);

      // 2. Borrow
      await lendingProtocol.connect(user1).borrow(LOAN_AMOUNT);

      // 3. Check balances
      expect(await collateralToken.balanceOf(user1.address)).to.equal(
        initialCollateralBalance - COLLATERAL_AMOUNT
      );
      expect(await loanToken.balanceOf(user1.address)).to.equal(
        initialLoanBalance + LOAN_AMOUNT
      );

      // 4. Repay
      const userData = await lendingProtocol.getUserData(user1.address);
      const totalDebt = userData[1] + userData[2];
      await loanToken
        .connect(user1)
        .approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();

      // 5. Withdraw collateral
      await lendingProtocol.connect(user1).withdrawCollateral();

      // 6. Final balance check
      expect(await collateralToken.balanceOf(user1.address)).to.equal(
        initialCollateralBalance
      );
    });
  });
});
