import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { CollateralAsset, BorrowableAsset, DeFiLending } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DeFiLending", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const Collateral = await ethers.getContractFactory("CollateralAsset");
    const collateralToken = (await Collateral.deploy()) as CollateralAsset;
    await collateralToken.deployed();

    const Borrowable = await ethers.getContractFactory("BorrowableAsset");
    const loanToken = (await Borrowable.deploy()) as BorrowableAsset;
    await loanToken.deployed();

    const Protocol = await ethers.getContractFactory("DeFiLending");
    const lending = (await Protocol.deploy(
      collateralToken.address,
      loanToken.address
    )) as DeFiLending;
    await lending.deployed();

    // Fund protocol with loan tokens
    const fundAmount = ethers.parseEther("100000");
    await loanToken.mint(lending.address, fundAmount);

    // Distribute to user
    const userAmount = ethers.parseEther("1000");
    await collateralToken.mint(user.address, userAmount);
    await loanToken.mint(user.address, userAmount);

    return { collateralToken, loanToken, lending, owner, user };
  }

  it("deployment sets correct addresses and constants", async () => {
    const { collateralToken, loanToken, lending } = await loadFixture(deployFixture);
    expect(await lending.collateralToken()).to.equal(collateralToken.address);
    expect(await lending.loanToken()).to.equal(loanToken.address);
    expect(await lending.MIN_COLLATERAL_RATIO()).to.equal(15000);
    expect(await lending.WEEKLY_INTEREST_RATE()).to.equal(500);
    expect(await lending.BASIS_POINTS()).to.equal(10000);
  });

  it("allows adding collateral and emits event", async () => {
    const { collateralToken, lending, user } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("1");
    await collateralToken.connect(user).approve(lending.address, amount);
    await expect(lending.connect(user).addCollateral(amount))
      .to.emit(lending, "CollateralAdded")
      .withArgs(user.address, amount);
    const [col] = await lending.fetchPosition(user.address);
    expect(col).to.equal(amount);
  });

  it("reverts zero collateral", async () => {
    const { lending, user } = await loadFixture(deployFixture);
    await expect(lending.connect(user).addCollateral(0)).to.be.revertedWith("Zero amount");
  });

  it("allows borrowing up to limit and emits event", async () => {
    const { collateralToken, loanToken, lending, user } = await loadFixture(deployFixture);
    const deposit = ethers.parseEther("1.5");
    const borrowAmt = ethers.parseEther("1");
    await collateralToken.connect(user).approve(lending.address, deposit);
    await lending.connect(user).addCollateral(deposit);
    await expect(lending.connect(user).drawLoan(borrowAmt))
      .to.emit(lending, "LoanDrawn")
      .withArgs(user.address, borrowAmt);
    const [, debt] = await lending.fetchPosition(user.address);
    expect(debt).to.equal(borrowAmt);
  });

  it("calculates interest after a week", async () => {
    const { collateralToken, lending, user } = await loadFixture(deployFixture);
    const deposit = ethers.parseEther("1.5");
    const borrowAmt = ethers.parseEther("1");
    await collateralToken.connect(user).approve(lending.address, deposit);
    await lending.connect(user).addCollateral(deposit);
    await lending.connect(user).drawLoan(borrowAmt);
    await time.increase(7 * 24 * 3600);
    const [, , interest] = await lending.fetchPosition(user.address);
    // 5% of 1 ether
    expect(interest).to.equal(ethers.parseEther("0.05"));
  });

  it("allows full repay and resets position", async () => {
    const { collateralToken, loanToken, lending, user } = await loadFixture(deployFixture);
    const deposit = ethers.parseEther("1.5");
    const borrowAmt = ethers.parseEther("1");
    await collateralToken.connect(user).approve(lending.address, deposit);
    await lending.connect(user).addCollateral(deposit);
    await lending.connect(user).drawLoan(borrowAmt);
    await time.increase(7 * 24 * 3600);
    const [, , interest] = await lending.fetchPosition(user.address);
    const total = borrowAmt.add(interest);
    await loanToken.connect(user).approve(lending.address, total);
    await expect(lending.connect(user).repayDebt())
      .to.emit(lending, "DebtRepaid")
      .withArgs(user.address, borrowAmt, interest);
    const [, debtAfter, interestAfter] = await lending.fetchPosition(user.address);
    expect(debtAfter).to.equal(0);
    expect(interestAfter).to.equal(0);
  });

  it("allows removing collateral after repay", async () => {
    const { collateralToken, loanToken, lending, user } = await loadFixture(deployFixture);
    const deposit = ethers.parseEther("1");
    await collateralToken.connect(user).approve(lending.address, deposit);
    await lending.connect(user).addCollateral(deposit);
    await expect(lending.connect(user).removeCollateral(deposit))
      .to.emit(lending, "CollateralRemoved")
      .withArgs(user.address, deposit);
    const [colAfter] = await lending.fetchPosition(user.address);
    expect(colAfter).to.equal(0);
  });
});
