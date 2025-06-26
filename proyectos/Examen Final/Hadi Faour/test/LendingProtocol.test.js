const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
  let owner, user1, user2;
  let collateralToken, loanToken, lendingProtocol;

  before(async function () {
    ({ owner, user1, user2, collateralToken, loanToken, lendingProtocol } = await deployContracts());

    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy();
    await collateralToken.waitForDeployment();

    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy();
    await loanToken.waitForDeployment();

    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress()
    );
    await lendingProtocol.waitForDeployment();

    // Transfer ownership of tokens to lending protocol
    await collateralToken.transferOwnership(await lendingProtocol.getAddress());
    await loanToken.transferOwnership(await lendingProtocol.getAddress());
  });

  describe("Initial Setup", function () {
    it("should deploy contracts with correct parameters", async function () {
      expect(await collateralToken.name()).to.equal("Collateral USD");
      expect(await collateralToken.symbol()).to.equal("cUSD");
      
      expect(await loanToken.name()).to.equal("Loan DAI");
      expect(await loanToken.symbol()).to.equal("dDAI");
      
      expect(await lendingProtocol.collateralToken()).to.equal(await collateralToken.getAddress());
      expect(await lendingProtocol.loanToken()).to.equal(await loanToken.getAddress());
    });

    it("should have correct constants", async function () {
      expect(await lendingProtocol.COLLATERAL_RATIO()).to.equal(150);
      expect(await lendingProtocol.INTEREST_RATE()).to.equal(5);
    });
  });

  describe("mintInitialCollateral", function () {
    it("should mint initial 1000 cUSD to user", async function () {
      await expect(lendingProtocol.connect(user1).mintInitialCollateral())
        .to.emit(lendingProtocol, "Deposited")
        .withArgs(user1.address, ethers.parseEther("1000"));
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await lendingProtocol.hasClaimedInitial(user1.address)).to.be.true;
    });

    it("should not allow multiple initial mints", async function () {
      await expect(lendingProtocol.connect(user1).mintInitialCollateral())
        .to.be.revertedWith("Initial cUSD already claimed");
    });
  });

  describe("depositCollateral", function () {
    before(async function () {
      // Mint initial collateral to user2 for testing
      await lendingProtocol.connect(user2).mintInitialCollateral();
    });

    it("should deposit collateral successfully", async function () {
      const depositAmount = ethers.parseEther("500");
      await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), depositAmount);
      
      await expect(lendingProtocol.connect(user2).depositCollateral(depositAmount))
        .to.emit(lendingProtocol, "Deposited")
        .withArgs(user2.address, depositAmount);
      
      expect(await lendingProtocol.collateralBalance(user2.address)).to.equal(depositAmount);
    });

    it("should fail with zero amount", async function () {
      await expect(lendingProtocol.connect(user2).depositCollateral(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("should fail without approval", async function () {
      await expect(lendingProtocol.connect(user1).depositCollateral(ethers.parseEther("100")))
        .to.be.revertedWith("Transfer failed");
    });
  });

  describe("borrowMax", function () {
    it("should borrow maximum amount (66% of collateral)", async function () {
      const collateral = ethers.parseEther("500");
      const expectedBorrow = (collateral * 100n) / 150n; // 66.66%
      const expectedInterest = (expectedBorrow * 5n) / 100n;
      
      await expect(lendingProtocol.connect(user2).borrowMax())
        .to.emit(lendingProtocol, "Borrowed")
        .withArgs(user2.address, expectedBorrow);
      
      const loan = await lendingProtocol.loans(user2.address);
      expect(loan.amount).to.equal(expectedBorrow);
      expect(loan.interest).to.equal(expectedInterest);
      expect(loan.interestMinted).to.be.false;
      
      expect(await loanToken.balanceOf(user2.address)).to.equal(expectedBorrow);
    });

    it("should fail with no collateral", async function () {
      await expect(lendingProtocol.connect(user1).borrowMax())
        .to.be.revertedWith("No collateral deposited");
    });

    it("should fail with existing loan", async function () {
      await expect(lendingProtocol.connect(user2).borrowMax())
        .to.be.revertedWith("Existing loan");
    });
  });

  describe("mintInterest", function () {
    it("should mint interest successfully", async function () {
      const loanBefore = await lendingProtocol.loans(user2.address);
      const balanceBefore = await loanToken.balanceOf(user2.address);
      
      await expect(lendingProtocol.connect(user2).mintInterest())
        .to.emit(lendingProtocol, "InterestMinted")
        .withArgs(user2.address, loanBefore.interest);
      
      const loanAfter = await lendingProtocol.loans(user2.address);
      expect(loanAfter.interestMinted).to.be.true;
      expect(await loanToken.balanceOf(user2.address)).to.equal(balanceBefore + loanBefore.interest);
    });

    it("should fail with no active loan", async function () {
      await expect(lendingProtocol.connect(user1).mintInterest())
        .to.be.revertedWith("No active loan");
    });

    it("should fail if interest already minted", async function () {
      await expect(lendingProtocol.connect(user2).mintInterest())
        .to.be.revertedWith("Interest already minted");
    });
  });

  describe("repayLoan", function () {
    it("should repay loan successfully", async function () {
      const loan = await lendingProtocol.loans(user2.address);
      const totalDebt = loan.amount + loan.interest;
      
      // Approve loanToken spending
      await loanToken.connect(user2).approve(await lendingProtocol.getAddress(), totalDebt);
      
      await expect(lendingProtocol.connect(user2).repayLoan())
        .to.emit(lendingProtocol, "Repaid")
        .withArgs(user2.address, totalDebt);
      
      const loanAfter = await lendingProtocol.loans(user2.address);
      expect(loanAfter.amount).to.equal(0);
      expect(loanAfter.interest).to.equal(0);
      expect(loanAfter.interestMinted).to.be.false;
    });

    it("should fail with no loan to repay", async function () {
      await expect(lendingProtocol.connect(user1).repayLoan())
        .to.be.revertedWith("No loan to repay");
    });
  });

  describe("withdrawCollateral", function () {
    it("should withdraw collateral successfully", async function () {
      const collateral = await lendingProtocol.collateralBalance(user2.address);
      const balanceBefore = await collateralToken.balanceOf(user2.address);
      
      await expect(lendingProtocol.connect(user2).withdrawCollateral())
        .to.emit(lendingProtocol, "Withdrawn")
        .withArgs(user2.address, collateral);
      
      expect(await lendingProtocol.collateralBalance(user2.address)).to.equal(0);
      expect(await collateralToken.balanceOf(user2.address)).to.equal(balanceBefore + collateral);
    });

    it("should fail with outstanding loan", async function () {
      // Setup new loan for user1
      await lendingProtocol.connect(user1).mintInitialCollateral();
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), ethers.parseEther("100"));
      await lendingProtocol.connect(user1).depositCollateral(ethers.parseEther("100"));
      await lendingProtocol.connect(user1).borrowMax();
      
      await expect(lendingProtocol.connect(user1).withdrawCollateral())
        .to.be.revertedWith("Outstanding loan");
    });

    it("should fail with no collateral", async function () {
      await expect(lendingProtocol.connect(owner).withdrawCollateral())
        .to.be.revertedWith("No collateral to withdraw");
    });
  });

  describe("getUserData", function () {
    it("should return correct user data", async function () {
      // Setup test user
      await lendingProtocol.connect(user2).mintInitialCollateral();
      await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), ethers.parseEther("200"));
      await lendingProtocol.connect(user2).depositCollateral(ethers.parseEther("200"));
      await lendingProtocol.connect(user2).borrowMax();
      
      const [collateral, debt, interest, interestMinted] = await lendingProtocol.getUserData(user2.address);
      
      expect(collateral).to.equal(ethers.parseEther("200"));
      expect(debt).to.equal((ethers.parseEther("200") * 100n) / 150n);
      expect(interest).to.equal(((ethers.parseEther("200") * 100n) / 150n * 5n) / 100n);
      expect(interestMinted).to.be.false;
    });
  });

  describe("Token Contracts", function () {
    describe("LoanToken", function () {
      it("should only allow owner to mint", async function () {
        await expect(loanToken.connect(user1).mint(user1.address, 100))
          .to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
      });

      it("should only allow owner to burnFrom", async function () {
        await expect(loanToken.connect(user1).burnFrom(user1.address, 100))
          .to.be.revertedWithCustomError(loanToken, "OwnableUnauthorizedAccount");
      });
    });

    describe("CollateralToken", function () {
      it("should only allow owner or self to mint", async function () {
        await expect(collateralToken.connect(user1).mint(user1.address, 100))
          .to.be.revertedWith("Not authorized");
      });

      it("should allow owner to mint", async function () {
        // Transfer ownership back to owner for testing
        await lendingProtocol.connect(owner).transferOwnership(owner.address);
        await collateralToken.connect(owner).mint(owner.address, 100);
        expect(await collateralToken.balanceOf(owner.address)).to.equal(100);
      });
    });
  });
});