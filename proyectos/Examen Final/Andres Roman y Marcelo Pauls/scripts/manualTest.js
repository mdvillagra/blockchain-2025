// scripts/manualTest.js
//
// Este script compila y despliega los contratos en Hardhat Network
// y luego prueba el flujo completo de depósito, préstamo, interés,
// repago y retiro. Usa comparaciones de BigInt en lugar de .eq().

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // ──────── 0. Compilar automáticamente antes de desplegar ────────
  console.log("Compilando contratos...");
  await hre.run("compile");
  console.log("✅ Compilación finalizada.\n");

  // ───────────── 1. Preparar signers ─────────────
  const [owner, user] = await ethers.getSigners();
  console.log("Owner address:", owner.address);
  console.log("User  address:", user.address);
  console.log("");

  // ───────────── 2. Desplegar CollateralToken ─────────────
  const Collateral = await ethers.getContractFactory("CollateralToken");
  const collateral = await Collateral.deploy();
  const collateralAddr = await collateral.getAddress();
  console.log("CollateralToken desplegado en:", collateralAddr);

  // ───────────── 3. Desplegar LoanToken ─────────────
  const Loan = await ethers.getContractFactory("LoanToken");
  const loan = await Loan.deploy();
  const loanAddr = await loan.getAddress();
  console.log("LoanToken desplegado en:", loanAddr);

  // ───────────── 4. Desplegar LendingProtocol ─────────────
  const Lending = await ethers.getContractFactory("LendingProtocol");
  const lending = await Lending.deploy(collateralAddr, loanAddr);
  const lendingAddr = await lending.getAddress();
  console.log("LendingProtocol desplegado en:", lendingAddr);
  console.log("");

  // ───────────── 5. Reservar dDAI dentro de LendingProtocol ─────────────
  const TEN_THOUSAND = ethers.parseUnits("10000", 18); // BigInt
  await loan.mint(lendingAddr, TEN_THOUSAND);
  console.log(
    `Se acuñaron ${ethers.formatUnits(TEN_THOUSAND, 18)} dDAI al protocolo`
  );

  // ───────────── 6. Dar cUSD al usuario ─────────────
  const ONE_THOUSAND = ethers.parseUnits("1000", 18); // BigInt
  await collateral.mint(user.address, ONE_THOUSAND);
  console.log(
    `Se acuñaron ${ethers.formatUnits(ONE_THOUSAND, 18)} cUSD a user`
  );

  // ───────────── 7. El usuario aprueba a LendingProtocol 500 cUSD ─────────────
  const FIVE_HUNDRED = ethers.parseUnits("500", 18); // BigInt
  await collateral.connect(user).approve(lendingAddr, FIVE_HUNDRED);
  console.log("User aprobó 500 cUSD a LendingProtocol");

  // ───────────── 8. El usuario deposita 500 cUSD ─────────────
  await lending.connect(user).depositCollateral(FIVE_HUNDRED);
  console.log("User depositó 500 cUSD en el protocolo");

  // Verifico que (colateral, deuda, interés) = (500, 0, 0)
  {
    const [colBal, principal, interest] = await lending.getUserData(
      user.address
    );
    // colBal, principal, interest son BigInt
    if (colBal !== FIVE_HUNDRED || principal !== 0n || interest !== 0n) {
      throw new Error(
        `❌ Error en depositCollateral:\n` +
          ` getUserData devolvió (colateral=${ethers.formatUnits(
            colBal,
            18
          )}, ` +
          `deuda=${ethers.formatUnits(principal, 18)}, ` +
          `interés=${ethers.formatUnits(interest, 18)}),\n` +
          ` pero se esperaba (500, 0, 0).`
      );
    }
    console.log("✔ depositCollateral OK → (colateral, deuda, interés) =", [
      ethers.formatUnits(colBal, 18),
      ethers.formatUnits(principal, 18),
      ethers.formatUnits(interest, 18),
    ]);
  }
  console.log("");

  // ───────────── 9. El usuario pide prestado 300 dDAI ─────────────
  const THREE_HUNDRED = ethers.parseUnits("300", 18); // BigInt
  await lending.connect(user).borrow(THREE_HUNDRED);
  console.log("User pidió prestado 300 dDAI");

  // Verifico (colateral=500, principal=300, interés=0)
  {
    const [colBal, principal, interest] = await lending.getUserData(
      user.address
    );
    if (
      principal !== THREE_HUNDRED ||
      interest !== 0n ||
      colBal !== FIVE_HUNDRED
    ) {
      throw new Error(
        `❌ Error en borrow:\n` +
          ` getUserData devolvió (colateral=${ethers.formatUnits(
            colBal,
            18
          )}, ` +
          `principal=${ethers.formatUnits(principal, 18)}, ` +
          `interés=${ethers.formatUnits(interest, 18)}),\n` +
          ` pero se esperaba (500, 300, 0).`
      );
    }
    console.log("✔ borrow OK → (colateral, principal, interés) =", [
      ethers.formatUnits(colBal, 18),
      ethers.formatUnits(principal, 18),
      ethers.formatUnits(interest, 18),
    ]);
  }

  // Verifico que el user recibió efectivamente 300 dDAI en su balance
  {
    const balDAI = await loan.balanceOf(user.address); // BigInt
    if (balDAI !== THREE_HUNDRED) {
      throw new Error(
        `❌ Error: el user no recibió 300 dDAI tras borrow(), balance actual dDAI=${ethers.formatUnits(
          balDAI,
          18
        )}`
      );
    }
    console.log("✔ El user recibió 300 dDAI en su balance");
  }
  console.log("");

  // ───────────── 10. Avanzar 2 semanas en Hardhat Network ─────────────
  await ethers.provider.send("evm_increaseTime", [2 * 7 * 24 * 3600]);
  await ethers.provider.send("evm_mine", []);
  console.log("⏳ Se avanzaron 2 semanas en el nodo Hardhat");

  // ───────────── 11. Verificar interés acumulado = 300 * 0.05 * 2 = 30 dDAI ─────────────
  {
    const [colBal, principal, interest] = await lending.getUserData(
      user.address
    );
    const EXPECTED_INTEREST = ethers.parseUnits("30", 18); // BigInt
    if (principal !== THREE_HUNDRED || interest !== EXPECTED_INTEREST) {
      throw new Error(
        `❌ Error en cálculo de interés:\n` +
          ` getUserData devolvió (principal=${ethers.formatUnits(
            principal,
            18
          )}, ` +
          `interés=${ethers.formatUnits(interest, 18)}),\n` +
          ` pero se esperaba (principal=300, interés=30).`
      );
    }
    console.log("✔ Interés acumulado correcto (30 dDAI tras 2 semanas)");
  }
  console.log("");

  // ───────────── 12. Preparar al user para repagar: mint + approve de 330 dDAI ─────────────
  const TOTAL_OWED = THREE_HUNDRED + ethers.parseUnits("30", 18); // 330 dDAI, BigInt
  await loan.mint(user.address, TOTAL_OWED);
  await loan.connect(user).approve(lendingAddr, TOTAL_OWED);
  console.log("User recibió y aprobó 330 dDAI para repago");
  console.log("");

  // ───────────── 13. El user repaga (principal + interés) ─────────────
  await lending.connect(user).repay();
  console.log("User ejecutó repay()");

  // Verifico que ahora (principal=0, interés=0, colateral sigue 500)
  {
    const [colBal, principal, interest] = await lending.getUserData(
      user.address
    );
    if (principal !== 0n || interest !== 0n || colBal !== FIVE_HUNDRED) {
      throw new Error(
        `❌ Error en repay():\n` +
          ` getUserData devolvió (colateral=${ethers.formatUnits(
            colBal,
            18
          )}, ` +
          `principal=${ethers.formatUnits(principal, 18)}, ` +
          `interés=${ethers.formatUnits(interest, 18)}),\n` +
          ` pero se esperaba (colateral=500, principal=0, interés=0).`
      );
    }
    console.log("✔ repay OK → (colateral, principal, interés) =", [
      ethers.formatUnits(colBal, 18),
      ethers.formatUnits(principal, 18),
      ethers.formatUnits(interest, 18),
    ]);
  }
  console.log("");

  // ───────────── 14. El user retira colateral (500 cUSD) ─────────────
  await lending.connect(user).withdrawCollateral();
  console.log("User ejecutó withdrawCollateral()");

  // Verifico balance final de cUSD del user
  {
    // Tras mint inicial 1000 cUSD, depositó 500 → le quedan 500.
    // Después de repago, sigue con 500, y al retirar 500 → vuelve a 1000.
    const finalBal = await collateral.balanceOf(user.address); // BigInt
    if (finalBal !== ONE_THOUSAND) {
      throw new Error(
        `❌ Error en withdrawCollateral:\n` +
          ` el balance final de cUSD es ${ethers.formatUnits(finalBal, 18)}, ` +
          `pero se esperaba 1000.`
      );
    }
    console.log(
      "✔ El user recibió 500 cUSD de vuelta, balance final =",
      ethers.formatUnits(finalBal, 18)
    );
  }
  console.log("\n🎉 ¡TODAS las pruebas manuales pasaron correctamente! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
