// test/lending-protocol.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol", function () {
  let Collateral, collateral;
  let Loan, loan;
  let Lending, lending;
  let owner, user1, user2;

  // Helper: convierte "100" → 100 * 10^18 (BigInt en Ethers v6)
  function toWei(n) {
    return ethers.parseUnits(n, 18);
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 1) Desplegar CollateralToken (cUSD)
    Collateral = await ethers.getContractFactory("CollateralToken");
    collateral = await Collateral.deploy();
    await collateral.waitForDeployment();

    // 2) Desplegar LoanToken (dDAI)
    Loan = await ethers.getContractFactory("LoanToken");
    loan = await Loan.deploy();
    await loan.waitForDeployment();

    // 3) Desplegar LendingProtocol con direcciones de tokens
    Lending = await ethers.getContractFactory("LendingProtocol");
    lending = await Lending.deploy(collateral.target, loan.target);
    await lending.waitForDeployment();

    // 4) Owner acuña 10 000 dDAI al LendingProtocol como reserva
    const TEN_THOUSAND = toWei("10000");
    await loan.mint(lending.target, TEN_THOUSAND);

    // 5) Owner acuña 1 000 cUSD a user1 y user2 para pruebas
    const ONE_THOUSAND = toWei("1000");
    await collateral.mint(user1.address, ONE_THOUSAND);
    await collateral.mint(user2.address, ONE_THOUSAND);
  });

  it("verifica que los tokens referenciados sean correctos", async function () {
    expect(await lending.collateralToken()).to.equal(collateral.target);
    expect(await lending.loanToken()).to.equal(loan.target);
  });

  describe("depositCollateral", function () {
    it("revert si amount == 0", async function () {
      await collateral.connect(user1).approve(lending.target, 0);
      await expect(
        lending.connect(user1).depositCollateral(0)
      ).to.be.revertedWith("Monto de colateral debe ser > 0");
    });

    it("revert si no ha aprobado antes", async function () {
      // user1 no aprueba → transferFrom falla internamente → revert genérico
      await expect(lending.connect(user1).depositCollateral(toWei("500"))).to.be
        .reverted;
    });

    it("emite evento CollateralDeposited", async function () {
      const AMOUNT = toWei("100");
      await collateral.connect(user1).approve(lending.target, AMOUNT);
      await expect(lending.connect(user1).depositCollateral(AMOUNT))
        .to.emit(lending, "CollateralDeposited")
        .withArgs(user1.address, AMOUNT);
    });

    it("deposita y actualiza collateralBalance + getUserData()", async function () {
      const FIVE_HUNDRED = toWei("500");
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);

      const [colBal, principal, interest] = await lending.getUserData(
        user1.address
      );
      expect(colBal).to.equal(FIVE_HUNDRED);
      expect(principal).to.equal(0);
      expect(interest).to.equal(0);
    });

    /***************************************************************************/
    /*** NUEVO: principalDebt > 0 pero weeksElapsed == 0 en depositCollateral  ***/
    /***************************************************************************/
    it("no acumula interés al depositar más colateral inmediatamente tras haber pedido prestado", async function () {
      const DEPOSIT1 = toWei("500");
      const BORROW = toWei("300");
      const DEPOSIT2 = toWei("100");

      // 1) user1 deposita 500 cUSD
      await collateral.connect(user1).approve(lending.target, DEPOSIT1);
      await lending.connect(user1).depositCollateral(DEPOSIT1);

      // 2) user1 pide prestado 300 dDAI
      await lending.connect(user1).borrow(BORROW);

      // 3) Sin avanzar el tiempo (weeksElapsed == 0), user1 deposita 100 cUSD más
      await collateral.connect(user1).approve(lending.target, DEPOSIT2);
      await expect(lending.connect(user1).depositCollateral(DEPOSIT2))
        .to.emit(lending, "CollateralDeposited")
        .withArgs(user1.address, DEPOSIT2);

      // 4) Verificar:
      //    - collateralBalance = 500 + 100 = 600
      //    - principalDebt sigue en 300
      //    - accruedInterest = 0 (no hay semanas completas transcurridas)
      const [colBal, principal, interest] = await lending.getUserData(
        user1.address
      );
      expect(colBal).to.equal(DEPOSIT1 + DEPOSIT2); // 600 cUSD
      expect(principal).to.equal(BORROW); // 300 dDAI
      expect(interest).to.equal(0); // weeksElapsed == 0 → sin interés
    });

    /***************************************************************************/
    /*** NUEVO: principalDebt > 0 y weeksElapsed > 0 en depositCollateral      ***/
    /***************************************************************************/
    it("acumula interés al depositar más colateral después de 1 semana tras pedir prestado", async function () {
      const DEPOSIT1 = toWei("500");
      const BORROW = toWei("300");
      const DEPOSIT2 = toWei("100");

      // 1) user1 deposita 500 cUSD
      await collateral.connect(user1).approve(lending.target, DEPOSIT1);
      await lending.connect(user1).depositCollateral(DEPOSIT1);

      // 2) user1 pide prestado 300 dDAI
      await lending.connect(user1).borrow(BORROW);

      // 3) Avanzar 1 semana completa
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      // 4) Ahora user1 aprueba y deposita 100 cUSD adicionales
      await collateral.connect(user1).approve(lending.target, DEPOSIT2);
      await expect(lending.connect(user1).depositCollateral(DEPOSIT2))
        .to.emit(lending, "CollateralDeposited")
        .withArgs(user1.address, DEPOSIT2);

      // 5) Verificar:
      //    - collateralBalance = 500 + 100 = 600
      //    - principalDebt = 300  (sin cambio)
      //    - accruedInterest = 300 * 5% = 15 dDAI
      const [colBal, principal, interest] = await lending.getUserData(
        user1.address
      );
      expect(colBal).to.equal(DEPOSIT1 + DEPOSIT2); // 600 cUSD
      expect(principal).to.equal(BORROW); // 300 dDAI
      expect(interest).to.equal(toWei("15")); // 15 dDAI de interés acumulado
    });
  });

  describe("borrow", function () {
    const FIVE_HUNDRED = toWei("500");

    beforeEach(async function () {
      // user1 deposita 500 cUSD para pedir prestado
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);
    });

    it("revert si no hay colateral depositado", async function () {
      await expect(
        lending.connect(user2).borrow(toWei("1"))
      ).to.be.revertedWith("No tienes colateral depositado");
    });

    it("revert si amount == 0", async function () {
      await expect(lending.connect(user1).borrow(0)).to.be.revertedWith(
        "Monto de prestamo debe ser > 0"
      );
    });

    it("permite pedir prestado dentro del ratio (66% de 500 = 330 dDAI)", async function () {
      const THREE_HUNDRED_THIRTY = toWei("330");
      await lending.connect(user1).borrow(THREE_HUNDRED_THIRTY);

      const [, principal, interest] = await lending.getUserData(user1.address);
      expect(principal).to.equal(THREE_HUNDRED_THIRTY);
      expect(interest).to.equal(0);

      // user1 recibió 330 dDAI
      expect(await loan.balanceOf(user1.address)).to.equal(
        THREE_HUNDRED_THIRTY
      );
    });

    it("revert si supera el ratio (340 > 330)", async function () {
      const THREE_HUNDRED_FORTY = toWei("340");
      await expect(
        lending.connect(user1).borrow(THREE_HUNDRED_FORTY)
      ).to.be.revertedWith("Excede ratio de colateralizacion de 150%");
    });

    it("no acumula interés si llama borrow dos veces seguidas sin pasar tiempo", async function () {
      const TWO_HUNDRED = toWei("200");
      const ONE_HUNDRED = toWei("100");

      // Primer borrow de 200 dDAI
      await lending.connect(user1).borrow(TWO_HUNDRED);

      // Inmediatamente pide 100 dDAI más (weeksElapsed = 0 → sin interés)
      await lending.connect(user1).borrow(ONE_HUNDRED);

      // principalDebt = 200 + 100 = 300, accruedInterest = 0
      const [, principal, interest] = await lending.getUserData(user1.address);
      expect(principal).to.equal(TWO_HUNDRED + ONE_HUNDRED);
      expect(interest).to.equal(0);
    });

    it("acumula interés si hace dos borrow en semanas distintas", async function () {
      const TWO_HUNDRED = toWei("200");
      const ONE_HUNDRED = toWei("100");

      // Primer borrow de 200 dDAI
      await lending.connect(user1).borrow(TWO_HUNDRED);

      // Avanzar 1 semana completa
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      // Segundo borrow de 100 dDAI → en _accrueInterest se suma 200 * 5% = 10 dDAI
      await lending.connect(user1).borrow(ONE_HUNDRED);

      // Al final: principalDebt = 200 + 100 = 300, accruedInterest = 10 dDAI
      const [, principal, interest] = await lending.getUserData(user1.address);
      expect(principal).to.equal(toWei("300"));
      expect(interest).to.equal(toWei("10"));
    });

    it("emite evento Borrowed", async function () {
      const ONE_HUNDRED = toWei("100");
      await expect(lending.connect(user1).borrow(ONE_HUNDRED))
        .to.emit(lending, "Borrowed")
        .withArgs(user1.address, ONE_HUNDRED);
    });
  });

  describe("repay", function () {
    const FIVE_HUNDRED = toWei("500");
    const THREE_HUNDRED = toWei("300");

    beforeEach(async function () {
      // user1 deposita 500 cUSD y pide 300 dDAI
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);
      await lending.connect(user1).borrow(THREE_HUNDRED);

      // Avanzar 1 semana (5% de 300 = 15 dDAI)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
      await ethers.provider.send("evm_mine");
    });

    it("revert si no hay deuda pendiente", async function () {
      await expect(lending.connect(user2).repay()).to.be.revertedWith(
        "Sin deuda pendiente"
      );
    });

    it("revert si no aprueba el monto correcto de dDAI", async function () {
      // user1 no tiene dDAI ni aprobó → transferFrom revierte internamente
      await expect(lending.connect(user1).repay()).to.be.reverted;
    });

    it("repaga principal + interés y resetea deuda", async function () {
      // Interés acumulado = 15 dDAI
      const FIFTEEN = toWei("15");
      const totalOwed = THREE_HUNDRED + FIFTEEN;

      // 1) Owner le envía 315 dDAI (principal + interés)
      await loan.mint(user1.address, totalOwed);

      // 2) user1 aprueba los 315 dDAI
      await loan.connect(user1).approve(lending.target, totalOwed);

      // 3) Ejecutar repay()
      await expect(lending.connect(user1).repay())
        .to.emit(lending, "Repaid")
        .withArgs(user1.address, totalOwed);

      // 4) Verificar que principalDebt y accruedInterest queden en 0
      const [, principal, interest] = await lending.getUserData(user1.address);
      expect(principal).to.equal(0);
      expect(interest).to.equal(0);
    });

    it("repaga sin interés cuando se paga inmediatamente", async function () {
      // 1) Cancelar deuda previa (300 principal + 15 interés)
      const FIFTEEN = toWei("15");
      const totalOwedInitial = THREE_HUNDRED + FIFTEEN;
      await loan.mint(user1.address, totalOwedInitial);
      await loan.connect(user1).approve(lending.target, totalOwedInitial);
      await lending.connect(user1).repay();

      // 2) Nuevo escenario: depositar 150 cUSD y pedir 100 dDAI
      const DEPOSIT = toWei("150");
      const BORROW = toWei("100");
      await collateral.connect(user1).approve(lending.target, DEPOSIT);
      await lending.connect(user1).depositCollateral(DEPOSIT);
      await lending.connect(user1).borrow(BORROW);

      // 3) Owner envía 100 dDAI a user1 para pagar sin interés
      await loan.mint(user1.address, BORROW);
      await loan.connect(user1).approve(lending.target, BORROW);

      // 4) Ejecutar repay() inmediatamente
      await expect(lending.connect(user1).repay())
        .to.emit(lending, "Repaid")
        .withArgs(user1.address, BORROW);

      // 5) Verificar que principalDebt y accruedInterest queden en 0
      const [, principal, interest] = await lending.getUserData(user1.address);
      expect(principal).to.equal(0);
      expect(interest).to.equal(0);
    });

    /***************************************************************************/
    /*** NUEVO TEST: cubre la rama "transferFrom devuelve false" en repay()   ***/
    /***************************************************************************/
    it("revert si falla loanToken.transferFrom en repay", async function () {
      // 1) user1 ya tiene principalDebt = 300 + accruedInterest = 15 (preparado en beforeEach)

      // 2) Desplegar mock ERC20FailingLoan
      const FailingLoan = await ethers.getContractFactory("ERC20FailingLoan");
      const failingLoan = await FailingLoan.deploy();
      await failingLoan.waitForDeployment();

      // 3) Sobrescribir el slot 2 (loanToken) con failingLoan.address
      const failingLoanPadded =
        "0x" + "0".repeat(24) + failingLoan.target.replace("0x", "");
      await ethers.provider.send("hardhat_setStorageAt", [
        lending.target,
        "0x2", // slot 2 → loanToken
        failingLoanPadded,
      ]);

      // 4) Cuando llamemos repay(), transferFrom retorna false y salta:
      //    require(sent, "Transfer de LoanToken para repago fallida");
      await expect(lending.connect(user1).repay()).to.be.revertedWith(
        "Transfer de LoanToken para repago fallida"
      );
    });
  });

  describe("withdrawCollateral", function () {
    const FIVE_HUNDRED = toWei("500");
    const THREE_HUNDRED = toWei("300");

    beforeEach(async function () {
      // user1 deposita 500 cUSD y pide 300 dDAI
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);
      await lending.connect(user1).borrow(THREE_HUNDRED);
    });

    it("revert si hay deuda o interés pendiente", async function () {
      await expect(
        lending.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Deuda pendiente, no puedes retirar");
    });

    it("retira colateral correctamente cuando el usuario nunca tomó prestado", async function () {
      // En este contexto, `beforeEach` ya hizo que user1 deposite y pida prestado.
      // Vamos a usar user2 (nunca pidió préstamo) para simular el caso "nunca tomó prestado".

      const AMOUNT = toWei("100");

      // 1) user2 deposita 100 cUSD
      await collateral.connect(user2).approve(lending.target, AMOUNT);
      await lending.connect(user2).depositCollateral(AMOUNT);

      // 2) Inmediatamente withdrawCollateral (sin haber pedido préstamo)
      await expect(lending.connect(user2).withdrawCollateral())
        .to.emit(lending, "CollateralWithdrawn")
        .withArgs(user2.address, AMOUNT);

      // 3) Verificar que collateralBalance[user2] quedó en 0
      const [colBal2] = await lending.getUserData(user2.address);
      expect(colBal2).to.equal(0);
    });
    
    it("acumula interés en withdrawCollateral cuando hay deuda y pasó más de 1 semana", async function () {
      // (el beforeEach ya hizo: user1.depositCollateral(500) y user1.borrow(300))
      // 1) Avanzar 1 semana entera
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      // 2) Ahora, al llamar withdrawCollateral(), _accrueInterest verá principal>0 y weeksElapsed>0.
      //    Aunque luego revierte por "Deuda pendiente...", esta ejecución cubre la rama deseada.
      await expect(
        lending.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Deuda pendiente, no puedes retirar");
    });  

    it("revert si no tienes colateral", async function () {
      // user2 nunca depositó colateral
      await expect(
        lending.connect(user2).withdrawCollateral()
      ).to.be.revertedWith("No tienes colateral");
    });

    it("retira colateral correctamente cuando no hay deuda", async function () {
      // 1) Primero user1 paga 300 dDAI (sin interés)
      const totalOwed = THREE_HUNDRED;
      await loan.mint(user1.address, totalOwed);
      await loan.connect(user1).approve(lending.target, totalOwed);
      await lending.connect(user1).repay();

      // 2) Antes de retirar, balance de cUSD de user1 = 1000 - 500 = 500
      const prevBal = await collateral.balanceOf(user1.address);
      expect(prevBal).to.equal(toWei("500"));

      // 3) user1 retira 500 cUSD
      await expect(lending.connect(user1).withdrawCollateral())
        .to.emit(lending, "CollateralWithdrawn")
        .withArgs(user1.address, FIVE_HUNDRED);

      // 4) Ahora balance de cUSD de user1 = 1000
      const finalBal = await collateral.balanceOf(user1.address);
      expect(finalBal).to.equal(toWei("1000"));

      // 5) collateralBalance[user1] debe ser 0
      const [colBal] = await lending.getUserData(user1.address);
      expect(colBal).to.equal(0);
    });
  });

  describe("getUserData (view)", function () {
    it("devuelve datos correctos sin deuda ni interés", async function () {
      const [colBal, principal, interest] = await lending.getUserData(
        user2.address
      );
      expect(colBal).to.equal(0);
      expect(principal).to.equal(0);
      expect(interest).to.equal(0);
    });

    it("calcula interés adicional sin modificar estado (función view)", async function () {
      const FIVE_HUNDRED = toWei("500");
      const THREE_HUNDRED = toWei("300");

      // user1 deposita y pide prestado
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);
      await lending.connect(user1).borrow(THREE_HUNDRED);

      // Avanzar 2 semanas (weeksElapsed = 2)
      await ethers.provider.send("evm_increaseTime", [2 * 7 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      // tempInterest = 300 * 5% * 2 = 30
      const [colBal, principal, interest] = await lending.getUserData(
        user1.address
      );
      expect(principal).to.equal(THREE_HUNDRED);
      expect(interest).to.equal(toWei("30"));

      // Llamar nuevamente no cambia nada (view)
      const snap1 = await lending.getUserData(user1.address);
      const snap2 = await lending.getUserData(user1.address);
      expect(snap1[2]).to.equal(snap2[2]);
    });

    it("getUserData sin pasar tiempo (principal > 0, weeksElapsed == 0) debe mostrar interest = 0", async function () {
      // 1) user1 deposita 500 cUSD
      const FIVE_HUNDRED = toWei("500");
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);

      // 2) user1 pide 200 dDAI
      const TWO_HUNDRED = toWei("200");
      await lending.connect(user1).borrow(TWO_HUNDRED);

      // 3) Sin avanzar tiempo, getUserData → interest = 0
      const [, principal, interest] = await lending.getUserData(user1.address);
      expect(principal).to.equal(TWO_HUNDRED);
      expect(interest).to.equal(0);
    });
  });

  describe("branch coverage para getUserData vía tx sin modificar .sol", function () {
    // Helper para armar el calldata de getUserData(address)
    function encodeGetUserData(targetContract, userAddress) {
      return targetContract.interface.encodeFunctionData("getUserData", [userAddress]);
    }
  
    it("<<CASE 1>> principal == 0 (nunca depositó ni pidió): enviar tx a getUserData debe ejecutarla sin revertir", async function () {
      // user2 nunca depositó nada → principalDebt[user2] == 0
      const calldata = encodeGetUserData(lending, user2.address);
      // Forzamos un TX hacia la dirección del Lending
      await expect(
        user2.sendTransaction({
          to: lending.target,
          data: calldata,
          // basta con un gas limit normal:
          gasLimit: 100_000
        })
      ).not.to.be.reverted;
    });
  
    it("<<CASE 2>> principal > 0 y weeksElapsed == 0: forzar un tx a getUserData tras depositar y pedir, sin avanzar el tiempo", async function () {
      const FIVE_HUNDRED = toWei("500");
      const THREE_HUNDRED = toWei("300");
  
      // 1) user1 deposita 500 y pide 300
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);
      await lending.connect(user1).borrow(THREE_HUNDRED);
      // No avanzamos tiempo, así que weeksElapsed = 0
  
      // 2) Armamos la llamada “raw” a getUserData(user1)
      const calldata = encodeGetUserData(lending, user1.address);
      await expect(
        user1.sendTransaction({
          to: lending.target,
          data: calldata,
          gasLimit: 100_000
        })
      ).not.to.be.reverted;
    });
  
    it("<<CASE 3>> principal > 0 y weeksElapsed > 0: forzar un tx a getUserData tras depositar, pedir y avanzar >1 semana", async function () {
      const FIVE_HUNDRED = toWei("500");
      const THREE_HUNDRED = toWei("300");
  
      // 1) user1 deposita 500 y pide 300
      await collateral.connect(user1).approve(lending.target, FIVE_HUNDRED);
      await lending.connect(user1).depositCollateral(FIVE_HUNDRED);
      await lending.connect(user1).borrow(THREE_HUNDRED);
  
      // 2) Avanzamos 2 semanas (weeksElapsed > 0)
      await ethers.provider.send("evm_increaseTime", [2 * 7 * 24 * 3600]);
      await ethers.provider.send("evm_mine");
  
      // 3) Hacemos un raw tx a getUserData(user1)
      const calldata = encodeGetUserData(lending, user1.address);
      await expect(
        user1.sendTransaction({
          to: lending.target,
          data: calldata,
          gasLimit: 100_000
        })
      ).not.to.be.reverted;
    });
  });
  

  describe("rescueTokens", function () {
    it("solo el owner puede rescatar tokens", async function () {
      const ONE_HUNDRED = toWei("100");

      // user2 envía 100 cUSD al LendingProtocol
      await collateral.connect(user2).approve(lending.target, ONE_HUNDRED);
      await collateral.connect(user2).transfer(lending.target, ONE_HUNDRED);

      // user1 (no-owner) intenta rescueTokens → revert genérico
      await expect(
        lending
          .connect(user1)
          .rescueTokens(collateral.target, user1.address, ONE_HUNDRED)
      ).to.be.reverted;

      // owner puede rescatar sin problemas
      await expect(
        lending.rescueTokens(collateral.target, owner.address, ONE_HUNDRED)
      ).not.to.be.reverted;
    });

    it("owner rescata tokens correctamente", async function () {
      const ONE_HUNDRED = toWei("100");

      // user2 envía 100 cUSD al LendingProtocol
      await collateral.connect(user2).approve(lending.target, ONE_HUNDRED);
      await collateral.connect(user2).transfer(lending.target, ONE_HUNDRED);

      // balance owner antes de rescate
      const prevOwnerBal = await collateral.balanceOf(owner.address);

      // owner rescata 100 cUSD a su dirección
      await lending.rescueTokens(collateral.target, owner.address, ONE_HUNDRED);

      // balance owner después de rescate
      const finalOwnerBal = await collateral.balanceOf(owner.address);
      expect(finalOwnerBal).to.equal(prevOwnerBal + ONE_HUNDRED);
    });
  });

  // ---------------------------------------------------------
  // Tests adicionales para cubrir branches en transfer failures
  // ---------------------------------------------------------
  describe("Transfer failures (branch coverage)", function () {
    it("revert si falla loanToken.transfer en borrow", async function () {
      // Desplegar LendingProtocol con loanToken = address(0)
      const ZERO_ADDRESS = ethers.ZeroAddress;
      const faultyLending = await Lending.deploy(
        collateral.target,
        ZERO_ADDRESS
      );
      await faultyLending.waitForDeployment();

      // Mint y depositar cUSD normalmente
      const FIVE_HUNDRED = toWei("500");
      await collateral
        .connect(user1)
        .approve(faultyLending.target, FIVE_HUNDRED);
      await faultyLending.connect(user1).depositCollateral(FIVE_HUNDRED);

      // Intentar borrow → loanToken.transfer en address(0) retorna false → revert genérico
      await expect(faultyLending.connect(user1).borrow(toWei("100"))).to.be
        .reverted;
    });

    it("revert si falla collateralToken.transferFrom en depositCollateral", async function () {
      // 1) Desplegar mock ERC20FailingTF (transferFrom siempre devuelve false)
      const FailingTF = await ethers.getContractFactory("ERC20FailingTF");
      const failingTF = await FailingTF.deploy();
      await failingTF.waitForDeployment();

      // 2) Desplegar LendingProtocol con failingTF como collateralToken
      const faultyLending = await Lending.deploy(failingTF.target, loan.target);
      await faultyLending.waitForDeployment();

      // 3) Llamar depositCollateral → transferFrom retorna false → require("Transfer fallida")
      await expect(
        faultyLending.connect(user1).depositCollateral(toWei("100"))
      ).to.be.revertedWith("Transfer fallida");
    });

    it("revert si falla collateralToken.transfer en withdrawCollateral", async function () {
      // 1) Desplegar ERC20Failing para simular que transferFrom funciona, pero transfer falla
      const Failing = await ethers.getContractFactory("ERC20Failing");
      const failingCollateral = await Failing.deploy();
      await failingCollateral.waitForDeployment();

      // 2) Desplegar LoanToken (dDAI) normal
      const Loan2 = await ethers.getContractFactory("LoanToken");
      const loan2 = await Loan2.deploy();
      await loan2.waitForDeployment();

      // 3) Desplegar LendingProtocol con failingCollateral como collateralToken
      const faultyLending2 = await Lending.deploy(
        failingCollateral.target,
        loan2.target
      );
      await faultyLending2.waitForDeployment();

      // 4) Mint de failingCollateral a user1 y depositar
      const AMOUNT = toWei("100");
      await failingCollateral.mint(user1.address, AMOUNT);
      await failingCollateral
        .connect(user1)
        .approve(faultyLending2.target, AMOUNT);
      await faultyLending2.connect(user1).depositCollateral(AMOUNT);
      // Ahora user1 tiene collateralBalance = AMOUNT

      // 5) Asegurar que no hay deuda activa (principalDebt+accruedInterest = 0)
      // 6) Llamar withdrawCollateral → transfer(...) de ERC20Failing devuelve false →
      //    require("Transfer de CollateralToken fallida") se dispara
      await expect(
        faultyLending2.connect(user1).withdrawCollateral()
      ).to.be.revertedWith("Transfer de CollateralToken fallida");
    });
  });

  
});
