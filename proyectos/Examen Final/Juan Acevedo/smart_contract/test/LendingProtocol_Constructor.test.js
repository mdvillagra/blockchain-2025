const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Constructor y Configuración", function () {
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

  it("Debe revertir con direcciones cero", async function () {
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    
    await expect(LendingProtocol.deploy(
      ZERO_ADDRESS,
      await loanToken.getAddress(),
      owner.address
    )).to.be.revertedWith("Direccion token colateral invalida");

    await expect(LendingProtocol.deploy(
      await collateralToken.getAddress(),
      ZERO_ADDRESS,
      owner.address
    )).to.be.revertedWith("Direccion token prestamo invalida");
  });
});