const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Depósito de Colateral", function () {
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

  it("Flujo normal de depósito", async function () {
    await collateralToken.connect(user1).approve(
      await lendingProtocol.getAddress(), 
      COLLATERAL_AMOUNT
    );

    await expect(lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT))
      .to.emit(lendingProtocol, "CollateralDeposited")
      .withArgs(user1.address, COLLATERAL_AMOUNT);

    const position = await lendingProtocol.positions(user1.address);
    expect(position.collateralAmount).to.equal(COLLATERAL_AMOUNT);
  });

  it("Validaciones de depósito", async function () {
    await expect(lendingProtocol.connect(user1).depositCollateral(0))
      .to.be.revertedWith("Monto debe ser mayor a 0");

    await expect(lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT))
      .to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
  });
});