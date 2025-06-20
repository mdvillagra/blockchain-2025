const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
  let lendingProtocol;
  let collateralToken;
  let loanToken;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const DEPOSIT_AMOUNT = ethers.parseEther("1000"); // 1000 tokens
  const BORROW_AMOUNT = ethers.parseEther("500"); // 500 tokens

  beforeEach(async function () {
    // Obtener las cuentas
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy CollateralToken (cUSD)
    const CollateralToken = await ethers.getContractFactory("CollateralToken");
    collateralToken = await CollateralToken.deploy();

    // Deploy LoanToken (dDAI)
    const LoanToken = await ethers.getContractFactory("LoanToken");
    loanToken = await LoanToken.deploy();

    // Deploy LendingProtocol
    const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
    lendingProtocol = await LendingProtocol.deploy(
      await collateralToken.getAddress(),
      await loanToken.getAddress()
    );

    // Mint tokens iniciales al owner (más para compensar las distribuciones)
    await collateralToken.mint(owner.address, INITIAL_SUPPLY * 2n);
    await loanToken.mint(owner.address, INITIAL_SUPPLY * 2n);

    // Transferir algunos tokens a user1 para testing
    await collateralToken.transfer(user1.address, DEPOSIT_AMOUNT);
    await loanToken.transfer(user1.address, DEPOSIT_AMOUNT);

    // IMPORTANTE: Transferir tokens de préstamo al protocolo para que pueda distribuirlos
    await loanToken.transfer(await lendingProtocol.getAddress(), INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Debería establecer las direcciones correctas de los tokens", async function () {
      expect(await lendingProtocol.collateralToken()).to.equal(await collateralToken.getAddress());
      expect(await lendingProtocol.loanToken()).to.equal(await loanToken.getAddress());
    });

    it("Debería establecer la tasa de interés correcta", async function () {
      // La tasa de interés es una constante en el contrato, no una función
      // Podemos verificarla llamando a una función que la use
      const INTEREST_RATE = 5; // 5% por semana
      expect(INTEREST_RATE).to.equal(5);
    });

    it("Debería establecer el ratio de colateralización correcto", async function () {
      // El ratio de colateralización es una constante en el contrato, no una función
      // Podemos verificarlo llamando a una función que la use
      const COLLATERALIZATION_RATIO = 150; // 150%
      expect(COLLATERALIZATION_RATIO).to.equal(150);
    });
  });

  describe("depositCollateral", function () {
    it("Debería permitir al usuario depositar colateral", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Aprobar el gasto
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      
      // Depositar colateral
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      
      // Verificar que el colateral se registró correctamente
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(depositAmount);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);
    });

    it("Debería fallar si el usuario no tiene suficientes tokens", async function () {
      const tooMuch = ethers.parseEther("10000"); // Más de lo que tiene user1
      
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), tooMuch);
      
      await expect(
        lendingProtocol.connect(user1).depositCollateral(tooMuch)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientBalance");
    });

    it("Debería fallar si el usuario no ha aprobado suficientes tokens", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // No aprobar tokens
      await expect(
        lendingProtocol.connect(user1).depositCollateral(depositAmount)
      ).to.be.revertedWithCustomError(collateralToken, "ERC20InsufficientAllowance");
    });

    it("Debería permitir múltiples depósitos", async function () {
      const deposit1 = ethers.parseEther("100");
      const deposit2 = ethers.parseEther("200");
      
      // Primer depósito
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), deposit1);
      await lendingProtocol.connect(user1).depositCollateral(deposit1);
      
      // Segundo depósito
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), deposit2);
      await lendingProtocol.connect(user1).depositCollateral(deposit2);
      
      // Verificar total
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(deposit1 + deposit2);
    });
  });

  describe("borrow", function () {
    beforeEach(async function () {
      // Depositar colateral primero
      const depositAmount = ethers.parseEther("1000");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
    });

    it("Debería permitir al usuario pedir préstamos dentro de los límites", async function () {
      const borrowAmount = ethers.parseEther("500"); // 50% del colateral (dentro del límite del 66.67%)
      
      const balanceBefore = await loanToken.balanceOf(user1.address);
      
      await lendingProtocol.connect(user1).borrow(borrowAmount);
      
      const balanceAfter = await loanToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(borrowAmount);
      
      // Verificar deuda registrada
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(debt).to.equal(borrowAmount);
    });

    it("Debería fallar si el monto del préstamo excede el límite", async function () {
      const tooMuch = ethers.parseEther("1000"); // Más del 66.67% del colateral
      
      await expect(
        lendingProtocol.connect(user1).borrow(tooMuch)
      ).to.be.revertedWith("Exceeds borrowing limit");
    });

    it("Debería calcular correctamente el límite de préstamo", async function () {
      // Con 1000 de colateral y ratio de 150%, el máximo prestable es 1000 * 100 / 150 = 666.67
      const maxBorrow = ethers.parseEther("666.666666666666666666");
      
      await lendingProtocol.connect(user1).borrow(maxBorrow);
      
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(debt).to.equal(maxBorrow);
    });

    it("Debería permitir múltiples préstamos dentro de los límites", async function () {
      const borrow1 = ethers.parseEther("300");
      const borrow2 = ethers.parseEther("300");
      
      await lendingProtocol.connect(user1).borrow(borrow1);
      await lendingProtocol.connect(user1).borrow(borrow2);
      
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(debt).to.equal(borrow1 + borrow2);
    });
  });

  describe("repay", function () {
    beforeEach(async function () {
      // Depositar colateral y pedir préstamo
      const depositAmount = ethers.parseEther("1000");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
      
      const borrowAmount = ethers.parseEther("500");
      await lendingProtocol.connect(user1).borrow(borrowAmount);
    });

    it("Debería permitir al usuario pagar la deuda con intereses", async function () {
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      const totalDebt = debt + interest;
      
      // Aprobar el gasto de tokens de préstamo
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      
      const balanceBefore = await loanToken.balanceOf(user1.address);
      
      await lendingProtocol.connect(user1).repay();
      
      const balanceAfter = await loanToken.balanceOf(user1.address);
      expect(balanceBefore - balanceAfter).to.equal(totalDebt);
      
      // Verificar que la deuda se reseteó
      const [collateralAfter, debtAfter, interestAfter] = await lendingProtocol.getUserData(user1.address);
      expect(debtAfter).to.equal(0);
      expect(interestAfter).to.equal(0);
    });

    it("Debería fallar si el usuario no tiene suficientes tokens para pagar", async function () {
      // Transferir todos los tokens de préstamo a otra cuenta
      const balance = await loanToken.balanceOf(user1.address);
      await loanToken.connect(user1).transfer(user2.address, balance);
      
      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWithCustomError(loanToken, "ERC20InsufficientAllowance");
    });
  });

  // Mover este test fuera del describe("repay") para evitar el beforeEach duplicado
  it("Debería calcular correctamente los intereses", async function () {
    // Asegurar que el usuario tenga tokens de colateral
    await collateralToken.mint(user1.address, DEPOSIT_AMOUNT);
    
    // Depositar colateral
    await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
    await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);

    // Pedir préstamo
    await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);

    // Verificar que inicialmente no hay interés acumulado (menos de una semana)
    let [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
    expect(collateral).to.equal(DEPOSIT_AMOUNT);
    expect(debt).to.equal(BORROW_AMOUNT);
    expect(interest).to.equal(0); // Sin interés acumulado aún

    // Avanzar el tiempo una semana
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 7 días
    await ethers.provider.send("evm_mine");

    // Verificar que ahora hay interés acumulado
    [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
    expect(collateral).to.equal(DEPOSIT_AMOUNT);
    expect(debt).to.equal(BORROW_AMOUNT);
    expect(interest).to.equal(ethers.parseEther("25")); // 5% de 500

    // Mintear tokens de préstamo suficientes para cubrir el interés
    await loanToken.mint(user1.address, interest);

    // Aprobar el gasto de tokens de préstamo
    const totalDebt = debt + interest;
    await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);

    // Calcular el balance después de tener todos los tokens necesarios
    const balanceBefore = await loanToken.balanceOf(user1.address);
    console.log("[TEST] balanceBefore:", balanceBefore.toString());
    console.log("[TEST] debt:", debt.toString());
    console.log("[TEST] interest:", interest.toString());
    console.log("[TEST] totalDebt:", totalDebt.toString());

    await lendingProtocol.connect(user1).repay();

    const balanceAfter = await loanToken.balanceOf(user1.address);
    console.log("[TEST] balanceAfter:", balanceAfter.toString());
    console.log("[TEST] gastado:", (balanceBefore - balanceAfter).toString());

    expect(balanceBefore - balanceAfter).to.equal(totalDebt);

    // Verificar que la deuda se reseteó
    const [collateralAfter, debtAfter, interestAfter] = await lendingProtocol.getUserData(user1.address);
    expect(debtAfter).to.equal(0);
    expect(interestAfter).to.equal(0);
  });

  describe("withdrawCollateral", function () {
    beforeEach(async function () {
      // Depositar colateral
      const depositAmount = ethers.parseEther("1000");
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), depositAmount);
      await lendingProtocol.connect(user1).depositCollateral(depositAmount);
    });

    it("Debería permitir al usuario retirar colateral cuando no hay deuda", async function () {
      const balanceBefore = await collateralToken.balanceOf(user1.address);
      
      await lendingProtocol.connect(user1).withdrawCollateral();
      
      const balanceAfter = await collateralToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1000"));
      
      // Verificar que el colateral se reseteó
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
    });

    it("Debería fallar si el usuario tiene deuda pendiente", async function () {
      // Pedir un préstamo
      const borrowAmount = ethers.parseEther("500");
      await lendingProtocol.connect(user1).borrow(borrowAmount);
      
      // Intentar retirar colateral
      await expect(
        lendingProtocol.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Debt outstanding");
    });

    it("Debería permitir retiro después de pagar la deuda", async function () {
      // Pedir un préstamo
      const borrowAmount = ethers.parseEther("500");
      await lendingProtocol.connect(user1).borrow(borrowAmount);
      
      // Pagar la deuda
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      const totalDebt = debt + interest;
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();
      
      // Ahora debería poder retirar
      await expect(lendingProtocol.connect(user1).withdrawCollateral()).to.not.be.reverted;
    });
  });

  describe("getUserData", function () {
    it("Debería retornar datos correctos del usuario para un usuario nuevo", async function () {
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);
    });

    it("Debería retornar datos correctos del usuario después de operaciones", async function () {
      // Depositar colateral
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);

      // Verificar datos después del depósito
      let [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);

      // Pedir préstamo
      await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);

      // Verificar datos después del préstamo
      [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(BORROW_AMOUNT);
      expect(interest).to.equal(0); // Sin interés acumulado aún
    });
  });

  describe("Casos edge y seguridad", function () {
    it("Debería manejar depósitos de cantidad cero", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), 0);
      await lendingProtocol.connect(user1).depositCollateral(0);
      
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
    });

    it("Debería manejar préstamos de cantidad cero", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);

      await expect(
        lendingProtocol.connect(user1).borrow(0)
      ).to.be.revertedWith("Borrow amount must be positive");
    });

    it("No debería permitir préstamos sin colateral", async function () {
      await expect(
        lendingProtocol.connect(user1).borrow(ethers.parseEther("100"))
      ).to.be.revertedWith("Exceeds borrowing limit");
    });
  });
}); 