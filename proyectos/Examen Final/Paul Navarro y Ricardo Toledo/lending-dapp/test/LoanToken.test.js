const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken (dDAI)", function () {
  let loanToken;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const TRANSFER_AMOUNT = ethers.parseEther("1000"); // 1000 tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy();
  });

  describe("Deployment", function () {
    it("Debería establecer el nombre correcto", async function () {
      expect(await loanToken.name()).to.equal("Debt DAI");
    });

    it("Debería establecer el símbolo correcto", async function () {
      expect(await loanToken.symbol()).to.equal("dDAI");
    });

    it("Debería establecer los decimales correctos", async function () {
      expect(await loanToken.decimals()).to.equal(18);
    });

    it("Debería comenzar con suministro total cero", async function () {
      expect(await loanToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Debería permitir al owner acuñar tokens", async function () {
      await loanToken.mint(user1.address, INITIAL_SUPPLY);
      
      expect(await loanToken.balanceOf(user1.address)).to.equal(INITIAL_SUPPLY);
      expect(await loanToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Debería permitir acuñar a dirección cero", async function () {
      await expect(
        loanToken.mint(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(loanToken, "ERC20InvalidReceiver");
    });

    it("Debería permitir acuñar cantidad cero", async function () {
      await loanToken.mint(user1.address, 0);
      
      expect(await loanToken.balanceOf(user1.address)).to.equal(0);
      expect(await loanToken.totalSupply()).to.equal(0);
    });

    it("Debería permitir múltiples acuñaciones a la misma dirección", async function () {
      await loanToken.mint(user1.address, TRANSFER_AMOUNT);
      await loanToken.mint(user1.address, TRANSFER_AMOUNT);
      
      expect(await loanToken.balanceOf(user1.address)).to.equal(TRANSFER_AMOUNT * 2n);
      expect(await loanToken.totalSupply()).to.equal(TRANSFER_AMOUNT * 2n);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await loanToken.mint(user1.address, INITIAL_SUPPLY);
    });

    it("Debería permitir al usuario transferir tokens", async function () {
      const balanceBefore = await loanToken.balanceOf(user2.address);
      
      await loanToken.connect(user1).transfer(user2.address, TRANSFER_AMOUNT);
      
      const balanceAfter = await loanToken.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería actualizar balances correctamente después de la transferencia", async function () {
      const user1BalanceBefore = await loanToken.balanceOf(user1.address);
      const user2BalanceBefore = await loanToken.balanceOf(user2.address);
      
      await loanToken.connect(user1).transfer(user2.address, TRANSFER_AMOUNT);
      
      const user1BalanceAfter = await loanToken.balanceOf(user1.address);
      const user2BalanceAfter = await loanToken.balanceOf(user2.address);
      
      expect(user1BalanceBefore - user1BalanceAfter).to.equal(TRANSFER_AMOUNT);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería fallar si el usuario no tiene suficientes tokens", async function () {
      const tooMuch = ethers.parseEther("2000000"); // Más de lo que tiene
      
      await expect(
        loanToken.connect(user1).transfer(user2.address, tooMuch)
      ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientBalance");
    });

    it("Debería permitir transferencia a sí mismo", async function () {
      const balanceBefore = await loanToken.balanceOf(user1.address);
      
      await loanToken.connect(user1).transfer(user1.address, TRANSFER_AMOUNT);
      
      const balanceAfter = await loanToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(balanceBefore); // Balance no cambia
    });

    it("Debería permitir transferencia de cantidad cero", async function () {
      const balanceBefore = await loanToken.balanceOf(user2.address);
      
      await loanToken.connect(user1).transfer(user2.address, 0);
      
      const balanceAfter = await loanToken.balanceOf(user2.address);
      expect(balanceAfter).to.equal(balanceBefore);
    });
  });

  describe("Allowances", function () {
    beforeEach(async function () {
      await loanToken.mint(user1.address, INITIAL_SUPPLY);
    });

    it("Debería permitir al usuario aprobar gastador", async function () {
      await loanToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      expect(await loanToken.allowance(user1.address, user2.address)).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería permitir al gastador transferir cantidad aprobada", async function () {
      await loanToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      const balanceBefore = await loanToken.balanceOf(user2.address);
      
      await loanToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT);
      
      const balanceAfter = await loanToken.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(TRANSFER_AMOUNT);
    });

    it("Debería fallar si el gastador intenta transferir más de lo aprobado", async function () {
      await loanToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      const tooMuch = ethers.parseEther("2000"); // Más de lo aprobado
      
      await expect(
        loanToken.connect(user2).transferFrom(user1.address, user2.address, tooMuch)
      ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
    });

    it("Debería fallar si el gastador intenta transferir más del balance", async function () {
      await loanToken.connect(user1).approve(user2.address, INITIAL_SUPPLY);
      
      // Transferir todo el balance a otra cuenta
      await loanToken.connect(user1).transfer(user2.address, INITIAL_SUPPLY);
      
      // Intentar transferir desde la cuenta vacía
      await expect(
        loanToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientBalance");
    });

    it("Debería actualizar allowance después de transferFrom", async function () {
      await loanToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      
      await loanToken.connect(user2).transferFrom(user1.address, user2.address, TRANSFER_AMOUNT);
      
      expect(await loanToken.allowance(user1.address, user2.address)).to.equal(0);
    });

    it("Debería permitir uso parcial de allowance", async function () {
      const approvalAmount = ethers.parseEther("2000");
      const transferAmount = ethers.parseEther("500");
      
      await loanToken.connect(user1).approve(user2.address, approvalAmount);
      
      await loanToken.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      expect(await loanToken.allowance(user1.address, user2.address)).to.equal(approvalAmount - transferAmount);
    });

    it("Debería permitir aprobación a dirección cero", async function () {
      await expect(
        loanToken.connect(user1).approve(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(loanToken, "ERC20InvalidSpender");
    });

    it("Debería permitir aprobación de cantidad cero", async function () {
      await loanToken.connect(user1).approve(user2.address, 0);
      
      expect(await loanToken.allowance(user1.address, user2.address)).to.equal(0);
    });
  });

  describe("Casos edge", function () {
    it("Debería manejar cantidades muy grandes", async function () {
      const largeAmount = ethers.parseEther("999999999999999999");
      await loanToken.mint(user1.address, largeAmount);
      
      expect(await loanToken.balanceOf(user1.address)).to.equal(largeAmount);
    });

    it("Debería manejar múltiples aprobaciones", async function () {
      await loanToken.mint(user1.address, INITIAL_SUPPLY);
      
      await loanToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT);
      await loanToken.connect(user1).approve(user2.address, TRANSFER_AMOUNT * 2n);
      
      expect(await loanToken.allowance(user1.address, user2.address)).to.equal(TRANSFER_AMOUNT * 2n);
    });

    it("Debería manejar transferencia a dirección cero", async function () {
      await loanToken.mint(user1.address, TRANSFER_AMOUNT);
      
      await expect(
        loanToken.connect(user1).transfer(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWithCustomError(loanToken, "ERC20InvalidReceiver");
    });
  });
}); 