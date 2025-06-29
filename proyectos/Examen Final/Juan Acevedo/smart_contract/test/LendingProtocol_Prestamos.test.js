const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Préstamos", function () {
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
  });

  it("Flujo normal de préstamo", async function () {
    await expect(lendingProtocol.connect(user1).borrow(BORROW_AMOUNT))
      .to.emit(lendingProtocol, "Borrowed")
      .withArgs(user1.address, BORROW_AMOUNT);

    const position = await lendingProtocol.positions(user1.address);
    expect(position.debtAmount).to.equal(BORROW_AMOUNT);
  });

  it("Validaciones de préstamo", async function () {
    // Validación: Monto debe ser mayor a 0
    await expect(lendingProtocol.connect(user1).borrow(0))
      .to.be.revertedWith("Monto debe ser mayor a 0");

    // Validación: No se permite tomar otro préstamo si ya hay uno activo
    await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);
    await expect(lendingProtocol.connect(user1).borrow(BORROW_AMOUNT))
      .to.be.revertedWith("Ya tiene un prestamo activo");

    // Validación: No se puede tomar un préstamo que exceda el límite
    await collateralToken.mint(user2.address, COLLATERAL_AMOUNT);
    await collateralToken.connect(user2).approve(
      await lendingProtocol.getAddress(), 
      COLLATERAL_AMOUNT
    );
    await lendingProtocol.connect(user2).depositCollateral(COLLATERAL_AMOUNT);
    
    const excessiveAmount = ethers.parseEther("101");
    await expect(lendingProtocol.connect(user2).borrow(excessiveAmount))
      .to.be.revertedWith("Excede limite de prestamo");

    // Validación: Fallo por balance insuficiente de loanToken en el contrato
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    const lendingProtocolNoTokens = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress(),
      owner.address
    );
    await collateralToken.mint(user1.address, COLLATERAL_AMOUNT);
    await collateralToken.connect(user1).approve(
      await lendingProtocolNoTokens.getAddress(),
      COLLATERAL_AMOUNT
    );
    await lendingProtocolNoTokens.connect(user1).depositCollateral(COLLATERAL_AMOUNT);
    await expect(lendingProtocolNoTokens.connect(user1).borrow(BORROW_AMOUNT))
      .to.be.revertedWithCustomError(loanToken, "ERC20InsufficientBalance");
  });
});