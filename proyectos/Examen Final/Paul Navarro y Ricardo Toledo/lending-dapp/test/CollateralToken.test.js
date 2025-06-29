const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralToken (cUSD)", function () {
  let collateralToken;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const TRANSFER_AMOUNT = ethers.parseEther("1000"); // 1000 tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy();
  });

  describe("Deployment", function () {
    it("Debería establecer el nombre correcto", async function () {
      expect(await collateralToken.name()).to.equal("Collateral USD");
    });

    it("Debería establecer el símbolo correcto", async function () {
      expect(await collateralToken.symbol()).to.equal("cUSD");
    });

    it("Debería establecer los decimales correctos", async function () {
      expect(await collateralToken.decimals()).to.equal(18);
    });

    it("Debería comenzar con suministro total cero", async function () {
      expect(await collateralToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Debería permitir al owner acuñar tokens", async function () {
      await collateralToken.mint(user1.address, INITIAL_SUPPLY);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(INITIAL_SUPPLY);
      expect(await collateralToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Debería permitir acuñar a dirección cero", async function () {
      await expect(
        collateralToken.mint(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InvalidReceiver");
    });

    it("Debería permitir acuñar cantidad cero", async function () {
      await collateralToken.mint(user1.address, 0);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(0);
      expect(await collateralToken.totalSupply()).to.equal(0);
    });

    it("Debería permitir múltiples acuñaciones a la misma dirección", async function () {
      await collateralToken.mint(user1.address, TRANSFER_AMOUNT);
      await collateralToken.mint(user1.address, TRANSFER_AMOUNT);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(TRANSFER_AMOUNT * 2n);
      expect(await collateralToken.totalSupply()).to.equal(TRANSFER_AMOUNT * 2n);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await collateralToken.mint(user1.address, INITIAL_SUPPLY);
    });

    it("Debería permitir al usuario transferir tokens", async function () {
      const balanceBefore = await collateralToken.balanceOf(user2.address);
      
      await collateralToken.connect(user1).transfer(user2.address, TRANSFER_AMOUNT);
      
      const balanceAfter = await collateralToken.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería actualizar balances correctamente después de la transferencia", async function () {
      const user1BalanceBefore = await collateralToken.balanceOf(user1.address);
      const user2BalanceBefore = await collateralToken.balanceOf(user2.address);
      
      await collateralToken.connect(user1).transfer(user2.address, TRANSFER_AMOUNT);
      
      const user1BalanceAfter = await collateralToken.balanceOf(user1.address);
      const user2BalanceAfter = await collateralToken.balanceOf(user2.address);
      
      expect(user1BalanceBefore - user1BalanceAfter).to.equal(TRANSFER_AMOUNT);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería fallar si el usuario no tiene suficientes tokens", async function () {
      const tooMuch = ethers.parseEther("2000000"); // Más de lo que tiene
      
      await expect(
        collateralToken.connect(user1).transfer(user2.address, tooMuch)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
    });

    it("Debería permitir transferencia a sí mismo", async function () {
      const balanceBefore = await collateralToken.balanceOf(user1.address);
      
      await collateralToken.connect(user1).transfer(user1.address, TRANSFER_AMOUNT);
      
      const balanceAfter = await collateralToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(balanceBefore); // Balance no cambia
    });

    it("Debería permitir transferencia de cantidad cero", async function () {
      const balanceBefore = await collateralToken.balanceOf(user2.address);
      
      await collateralToken.connect(user1).transfer(user2.address, 0);
      
      const balanceAfter = await collateralToken.balanceOf(user2.address);
      expect(balanceAfter).to.equal(balanceBefore);
    });
  });

  describe("Allowances", function () {
    beforeEach(async function () {
      await collateralToken.mint(user1.address, INITIAL_SUPPLY);
    });

    it("Debería permitir al usuario aprobar gastador", async function () {
      await collateralToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      expect(await collateralToken.allowance(user1.address, user2.address)).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería permitir al gastador transferir cantidad aprobada", async function () {
      await collateralToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      const balanceBefore = await collateralToken.balanceOf(user2.address);
      
      await collateralToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT);
      
      const balanceAfter = await collateralToken.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería fallar si el gastador intenta transferir más de lo aprobado", async function () {
      await collateralToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      const tooMuch = ethers.parseEther("2000"); // Más de lo aprobado
      
      await expect(
        collateralToken.connect(user2).transferFrom(user1.address, user2.address, tooMuch)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
    });

    it("Debería fallar si el gastador intenta transferir más del balance", async function () {
      await collateralToken.connect(user1).approve(user2.address, INITIAL_SUPPLY);
      
      // Transferir todo el balance a otra cuenta
      await collateralToken.connect(user1).transfer(user2.address, INITIAL_SUPPLY);
      
      // Intentar transferir desde la cuenta vacía
      await expect(
        collateralToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
    });

    it("Debería actualizar allowance después de transferFrom", async function () {
      await collateralToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      await collateralToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT);
      
      expect(await collateralToken.allowance(user1.address, user2.address)).to.equal(0);
    });

    it("Debería permitir uso parcial de allowance", async function () {
      const approvalAmount = ethers.parseEther("2000");
      const transferAmount = ethers.parseEther("500");
      
      await collateralToken.connect(user1).approve(user2.address, approvalAmount);
      
      await collateralToken.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      expect(await collateralToken.allowance(user1.address, user2.address)).to.equal(approvalAmount - transferAmount);
    });

    it("Debería permitir aprobación a dirección cero", async function () {
      await expect(
        collateralToken.connect(user1).approve(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InvalidSpender");
    });

    it("Debería permitir aprobación de cantidad cero", async function () {
      await collateralToken.connect(user1).approve(user2.address, 0);
      
      expect(await collateralToken.allowance(user1.address, user2.address)).to.equal(0);
    });
  });

  describe("Casos edge", function () {
    it("Debería manejar cantidades muy grandes", async function () {
      const largeAmount = ethers.parseEther("999999999999999999");
      await collateralToken.mint(user1.address, largeAmount);
      
      expect(await collateralToken.balanceOf(user1.address)).to.equal(largeAmount);
    });

    it("Debería manejar múltiples aprobaciones", async function () {
      await collateralToken.mint(user1.address, INITIAL_SUPPLY);
      
      await collateralToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      await collateralToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT * 2n);
      
      expect(await collateralToken.allowance(user1.address, user2.address)).to.equal(TRANSFER_AMOUNT * 2n);
    });

    it("Debería manejar transferencia a dirección cero", async function () {
      await collateralToken.mint(user1.address, TRANSFER_AMOUNT);
      
      await expect(
        collateralToken.connect(user1).transfer(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InvalidReceiver");
    });
  });
}); 