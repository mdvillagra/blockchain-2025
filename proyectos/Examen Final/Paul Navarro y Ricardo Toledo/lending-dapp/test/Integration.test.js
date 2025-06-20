const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integración del Protocolo de Lending", function () {
  let lendingProtocol;
  let collateralToken;
  let loanToken;
  let owner;
  let user1;
  let user2;
  let user3;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const DEPOSIT_AMOUNT = ethers.parseEther("1000"); // 1000 tokens
  const BORROW_AMOUNT = ethers.parseEther("500"); // 500 tokens

  beforeEach(async function () {
    // Obtener las cuentas
    [owner, user1, user2, user3] = await ethers.getSigners();

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

    // Transferir tokens a los usuarios para testing
    await collateralToken.transfer(user1.address, DEPOSIT_AMOUNT);
    await collateralToken.transfer(user2.address, DEPOSIT_AMOUNT);
    await collateralToken.transfer(user3.address, DEPOSIT_AMOUNT);
    
    await loanToken.transfer(user1.address, DEPOSIT_AMOUNT);
    await loanToken.transfer(user2.address, DEPOSIT_AMOUNT);
    await loanToken.transfer(user3.address, DEPOSIT_AMOUNT);

    // IMPORTANTE: Transferir tokens de préstamo al protocolo para que pueda distribuirlos
    await loanToken.transfer(await lendingProtocol.getAddress(), INITIAL_SUPPLY);
  });

  describe("Flujo completo de lending", function () {
    it("Debería permitir un flujo completo: depósito → préstamo → pago → retiro", async function () {
      // 1. Depositar colateral
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);
      
      let [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);

      // 2. Pedir préstamo
      await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);
      
      [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(BORROW_AMOUNT);
      expect(interest).to.equal(0); // Sin interés acumulado aún

      // 3. Pagar la deuda
      const totalDebt = debt + interest;
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();
      
      [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);

      // 4. Retirar colateral
      const balanceBefore = await collateralToken.balanceOf(user1.address);
      await lendingProtocol.connect(user1).withdrawCollateral();
      const balanceAfter = await collateralToken.balanceOf(user1.address);
      
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
      
      [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);
    });
  });

  describe("Múltiples usuarios", function () {
    it("Debería manejar múltiples usuarios simultáneamente", async function () {
      // Usuario 1: depósito y préstamo
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);

      // Usuario 2: solo depósito
      await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user2).depositCollateral(DEPOSIT_AMOUNT);

      // Usuario 3: depósito y préstamo máximo
      await collateralToken.connect(user3).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user3).depositCollateral(DEPOSIT_AMOUNT);
      const maxBorrow = ethers.parseEther("666.666666666666666666");
      await lendingProtocol.connect(user3).borrow(maxBorrow);

      // Verificar datos de cada usuario
      let [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(BORROW_AMOUNT);

      [collateral, debt, interest] = await lendingProtocol.getUserData(user2.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(0);

      [collateral, debt, interest] = await lendingProtocol.getUserData(user3.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(maxBorrow);
    });

    it("Debería permitir que los usuarios paguen sus deudas independientemente", async function () {
      // Configurar usuarios con deudas
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);

      await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user2).depositCollateral(DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user2).borrow(BORROW_AMOUNT);

      // Usuario 1 paga su deuda
      let [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      const totalDebt1 = debt + interest;
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt1);
      await lendingProtocol.connect(user1).repay();

      // Verificar que solo user1 pagó
      [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);

      [collateral, debt, interest] = await lendingProtocol.getUserData(user2.address);
      expect(debt).to.equal(BORROW_AMOUNT);
      expect(interest).to.equal(0); // Sin interés acumulado aún
    });
  });

  describe("Casos de límites", function () {
    it("Debería manejar préstamos al límite máximo", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);

      // Calcular límite máximo: 1000 * 100 / 150 = 666.67
      const maxBorrow = ethers.parseEther("666.666666666666666666");
      
      await lendingProtocol.connect(user1).borrow(maxBorrow);
      
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(debt).to.equal(maxBorrow);
    });

    it("Debería fallar al intentar exceder el límite máximo", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);

      const tooMuch = ethers.parseEther("700"); // Más del límite
      
      await expect(
        lendingProtocol.connect(user1).borrow(tooMuch)
      ).to.be.revertedWith("Exceeds borrowing limit");
    });

    it("Debería permitir préstamos adicionales si no exceden el límite total", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);

      // Primer préstamo
      const borrow1 = ethers.parseEther("300");
      await lendingProtocol.connect(user1).borrow(borrow1);

      // Segundo préstamo (debería fallar porque excede el límite total)
      const borrow2 = ethers.parseEther("400");
      await expect(
        lendingProtocol.connect(user1).borrow(borrow2)
      ).to.be.revertedWith("Exceeds borrowing limit");
    });
  });

  describe("Manejo de errores", function () {
    it("Debería manejar intentos de retiro con deuda pendiente", async function () {
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);

      await expect(
        lendingProtocol.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Debt outstanding");
    });

    it("Debería manejar intentos de préstamo sin colateral", async function () {
      await expect(
        lendingProtocol.connect(user1).borrow(BORROW_AMOUNT)
      ).to.be.revertedWith("Exceeds borrowing limit");
    });

    it("Debería manejar intentos de pago sin deuda", async function () {
      // El contrato ahora requiere que haya deuda para hacer repay
      await expect(
        lendingProtocol.connect(user1).repay()
      ).to.be.revertedWith("No debt to repay");
      
      // Verificar que el estado no cambió
      const [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);
    });
  });

  describe("Estados del protocolo", function () {
    it("Debería mantener el estado correcto después de múltiples operaciones", async function () {
      // Usuario 1: ciclo completo
      await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).depositCollateral(DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user1).borrow(BORROW_AMOUNT);
      
      let [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(BORROW_AMOUNT);

      // Pagar y retirar
      const totalDebt = debt + interest;
      await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), totalDebt);
      await lendingProtocol.connect(user1).repay();
      await lendingProtocol.connect(user1).withdrawCollateral();

      // Verificar estado final
      [collateral, debt, interest] = await lendingProtocol.getUserData(user1.address);
      expect(collateral).to.equal(0);
      expect(debt).to.equal(0);
      expect(interest).to.equal(0);

      // Usuario 2: solo depósito
      await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), DEPOSIT_AMOUNT);
      await lendingProtocol.connect(user2).depositCollateral(DEPOSIT_AMOUNT);

      [collateral, debt, interest] = await lendingProtocol.getUserData(user2.address);
      expect(collateral).to.equal(DEPOSIT_AMOUNT);
      expect(debt).to.equal(0);
    });
  });
}); 