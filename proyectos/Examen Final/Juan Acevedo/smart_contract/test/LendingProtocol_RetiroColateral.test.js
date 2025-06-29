const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Retiro de Colateral", function () {
  let collateralToken, loanToken, lendingProtocol, failingTransfer;
  let owner, user1, user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000");
  const COLLATERAL_AMOUNT = ethers.parseEther("150");
  const BORROW_AMOUNT = ethers.parseEther("100");
  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    const LoanToken = await ethers.getContractFactory("LoanToken");
    const FailingTransfer = await ethers.getContractFactory("FailingTransfer");
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");

    collateralToken = await CollateralToken.deploy(owner.address);
    loanToken = await LoanToken.deploy(owner.address);
    failingTransfer = await FailingTransfer.deploy();
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
  });

  it("Flujo normal de retiro", async function () {
    await expect(lendingProtocol.connect(user1).withdrawCollateral())
      .to.emit(lendingProtocol, "CollateralWithdrawn")
      .withArgs(user1.address, COLLATERAL_AMOUNT);

    const position = await lendingProtocol.positions(user1.address);
    expect(position.collateralAmount).to.equal(0);
  });

  it("Validaciones de retiro", async function () {
    await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);
    await expect(lendingProtocol.connect(user1).withdrawCollateral())
      .to.be.revertedWith("Tiene deuda pendiente");

    await expect(lendingProtocol.connect(user2).withdrawCollateral())
      .to.be.revertedWith("No tiene colateral");
  });

  it("Fallo en transferencia de colateral", async function () {
    // Desplegar un nuevo LendingProtocol con FailingTransfer
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    const failingLendingProtocol = await LendingProtocol.deploy(
      await failingTransfer.getAddress(),
      await loanToken.getAddress(),
      owner.address
    );

    // Configurar el escenario
    await failingTransfer.mint(user1.address, INITIAL_SUPPLY);
    await failingTransfer.connect(user1).approve(
      await failingLendingProtocol.getAddress(),
      COLLATERAL_AMOUNT
    );
    await failingLendingProtocol.connect(user1).depositCollateral(COLLATERAL_AMOUNT);

    // Intentar retirar colateral, debe fallar por transferencia
    await expect(failingLendingProtocol.connect(user1).withdrawCollateral())
      .to.be.revertedWith("Retiro fallo");
  });
});