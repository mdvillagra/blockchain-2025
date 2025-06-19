const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pruebas de integración del sistema de préstamos", function () {
  let protocolo;
  let tokenColateral;
  let tokenPrestamo;
  let admin;
  let cuentaA;
  let cuentaB;
  let cuentaC;

  const SUPPLY_INICIAL = ethers.parseEther("1000000");
  const MONTO_DEPOSITO = ethers.parseEther("1000");
  const MONTO_PRESTAMO = ethers.parseEther("500");

  beforeEach(async () => {
    [admin, cuentaA, cuentaB, cuentaC] = await ethers.getSigners();

    const TokenColateral = await ethers.getContractFactory("CollateralToken");
    tokenColateral = await TokenColateral.deploy();

    const TokenPrestamo = await ethers.getContractFactory("LoanToken");
    tokenPrestamo = await TokenPrestamo.deploy();

    const Protocolo = await ethers.getContractFactory("LendingProtocol");
    protocolo = await Protocolo.deploy(
      await tokenColateral.getAddress(),
      await tokenPrestamo.getAddress()
    );

    // Emitir tokens para el deployer
    await tokenColateral.mint(admin.address, SUPPLY_INICIAL * 2n);
    await tokenPrestamo.mint(admin.address, SUPPLY_INICIAL * 2n);

    // Distribuir tokens a las cuentas
    for (let cuenta of [cuentaA, cuentaB, cuentaC]) {
      await tokenColateral.transfer(cuenta.address, MONTO_DEPOSITO);
      await tokenPrestamo.transfer(cuenta.address, MONTO_DEPOSITO);
    }

    // Financiar el contrato de préstamos
    await tokenPrestamo.transfer(await protocolo.getAddress(), SUPPLY_INICIAL);
  });

  describe("Secuencia básica del préstamo", () => {
    it("Debe completar: depósito → préstamo → devolución → retiro", async () => {
      await tokenColateral.connect(cuentaA).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).depositCollateral(MONTO_DEPOSITO);

      let [colateral, deuda, interes] = await protocolo.getUserData(cuentaA.address);
      expect(colateral).to.equal(MONTO_DEPOSITO);
      expect(deuda).to.equal(0);
      expect(interes).to.equal(0);

      await protocolo.connect(cuentaA).borrow(MONTO_PRESTAMO);
      [colateral, deuda, interes] = await protocolo.getUserData(cuentaA.address);

      expect(deuda).to.equal(MONTO_PRESTAMO);
      expect(interes).to.equal(ethers.parseEther("25")); // 5%

      const total = deuda + interes;
      await tokenPrestamo.connect(cuentaA).approve(protocolo, total);
      await protocolo.connect(cuentaA).repay();

      [colateral, deuda, interes] = await protocolo.getUserData(cuentaA.address);
      expect(deuda).to.equal(0);

      const balanceAntes = await tokenColateral.balanceOf(cuentaA.address);
      await protocolo.connect(cuentaA).withdrawCollateral();
      const balanceDespues = await tokenColateral.balanceOf(cuentaA.address);

      expect(balanceDespues - balanceAntes).to.equal(MONTO_DEPOSITO);
    });
  });

  describe("Usuarios múltiples en paralelo", () => {
    it("Debe manejar acciones simultáneas de varios usuarios", async () => {
      await tokenColateral.connect(cuentaA).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).depositCollateral(MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).borrow(MONTO_PRESTAMO);

      await tokenColateral.connect(cuentaB).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaB).depositCollateral(MONTO_DEPOSITO);

      await tokenColateral.connect(cuentaC).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaC).depositCollateral(MONTO_DEPOSITO);
      const limiteMax = ethers.parseEther("666.666666666666666666");
      await protocolo.connect(cuentaC).borrow(limiteMax);

      let datos = await protocolo.getUserData(cuentaA.address);
      expect(datos[1]).to.equal(MONTO_PRESTAMO);

      datos = await protocolo.getUserData(cuentaB.address);
      expect(datos[1]).to.equal(0);

      datos = await protocolo.getUserData(cuentaC.address);
      expect(datos[1]).to.equal(limiteMax);
    });

    it("Debe permitir pagos independientes de deudas", async () => {
      for (let user of [cuentaA, cuentaB]) {
        await tokenColateral.connect(user).approve(protocolo, MONTO_DEPOSITO);
        await protocolo.connect(user).depositCollateral(MONTO_DEPOSITO);
        await protocolo.connect(user).borrow(MONTO_PRESTAMO);
      }

      const [_, deuda, interes] = await protocolo.getUserData(cuentaA.address);
      const totalA = deuda + interes;
      await tokenPrestamo.connect(cuentaA).approve(protocolo, totalA);
      await protocolo.connect(cuentaA).repay();

      let datosA = await protocolo.getUserData(cuentaA.address);
      let datosB = await protocolo.getUserData(cuentaB.address);

      expect(datosA[1]).to.equal(0);
      expect(datosB[1]).to.equal(MONTO_PRESTAMO);
    });
  });

  describe("Validación de límites", () => {
    it("Debe aceptar el préstamo máximo permitido", async () => {
      await tokenColateral.connect(cuentaA).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).depositCollateral(MONTO_DEPOSITO);
      const maximo = ethers.parseEther("666.666666666666666666");
      await protocolo.connect(cuentaA).borrow(maximo);
      const [, deuda] = await protocolo.getUserData(cuentaA.address);
      expect(deuda).to.equal(maximo);
    });

    it("Debe rechazar préstamos por encima del límite", async () => {
      await tokenColateral.connect(cuentaA).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).depositCollateral(MONTO_DEPOSITO);

      const excedido = ethers.parseEther("700");
      await expect(protocolo.connect(cuentaA).borrow(excedido)).to.be.revertedWith("Exceeds borrowing limit");
    });

    it("Debe aceptar múltiples préstamos dentro del margen permitido", async () => {
      await tokenColateral.connect(cuentaA).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).depositCollateral(MONTO_DEPOSITO);

      await protocolo.connect(cuentaA).borrow(ethers.parseEther("300"));

      await expect(
        protocolo.connect(cuentaA).borrow(ethers.parseEther("400"))
      ).to.be.revertedWith("Exceeds borrowing limit");
    });
  });

  describe("Pruebas de seguridad y errores", () => {
    it("Debe impedir retiros con deuda pendiente", async () => {
      await tokenColateral.connect(cuentaA).approve(protocolo, MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).depositCollateral(MONTO_DEPOSITO);
      await protocolo.connect(cuentaA).borrow(MONTO_PRESTAMO);

      await expect(
        protocolo.connect(cuentaA).withdrawCollateral()
      ).to.be.revertedWith("Debt outstanding");
    });

    it("Debe rechazar préstamos sin respaldo colateral", async () => {
      await expect(
        protocolo.connect(cuentaA).borrow(MONTO_PRESTAMO)
      ).to.be.revertedWith("Exceeds borrowing limit");
    });

    it("Debe permitir pagar sin tener deuda sin fallar", async () => {
      await expect(protocolo.connect(cuentaA).repay()).to.not.be.reverted;
      const [col, deu, int] = await protocolo.getUserData(cuentaA.address);
      expect(deu).to.equal(0);
    });
  });
});
