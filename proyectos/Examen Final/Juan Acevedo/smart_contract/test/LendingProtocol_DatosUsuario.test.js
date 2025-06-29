const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Datos de Usuario", function () {
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

  it("Devuelve información correcta", async function () {
    await collateralToken.connect(user1).approve(
      await lendingProtocol.getAddress(), 
      COLLATERAL_AMOUNT
    );
    await lendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
    await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);

    const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
    expect(collateral).to.equal(COLLATERAL_AMOUNT);
    expect(debt).to.equal(BORROW_AMOUNT);
    expect(interest).to.equal(BORROW_AMOUNT * 5n / 100n);
  });
});