const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pago de Préstamos", function () {
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

  beforeEach(async function () {
    await collateralToken.connect(user1).approve(
      await lendingProtocol.getAddress(), 
      COLLATERAL_AMOUNT
    );
    await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
    await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);
  });

  it("Flujo normal de pago", async function () {
    const interest = BORROW_AMOUNT * 5n / 100n;
    const totalRepay = BORROW_AMOUNT + interest;

    await loanToken.connect(owner).mint(user1.address, totalRepay);
    await loanToken.connect(user1).approve(
      await lendingProtocol.getAddress(), 
      totalRepay
    );

    await expect(lendingProtocol.connect(user1).repay())
      .to.emit(lendingProtocol, "Repaid")
      .withArgs(user1.address, BORROW_AMOUNT, interest);

    const position = await lendingProtocol.positions(user1.address);
    expect(position.debtAmount).to.equal(0);
  });

  it("Validaciones de pago", async function () {
    const interest = BORROW_AMOUNT * 5n / 100n;
    const totalRepay = BORROW_AMOUNT + interest;
    
    await loanToken.connect(owner).mint(user1.address, totalRepay);
    await loanToken.connect(user1).approve(
      await lendingProtocol.getAddress(), 
      totalRepay
    );
    await lendingProtocol.connect(user1).repay();
    
    await expect(lendingProtocol.connect(user1).repay())
      .to.be.revertedWith("No tiene deuda activa");

    await collateralToken.connect(user1).approve(
      await lendingProtocol.getAddress(), 
      COLLATERAL_AMOUNT
    );
    await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
    await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);
    
    await expect(lendingProtocol.connect(user1).repay())
      .to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
  });
});