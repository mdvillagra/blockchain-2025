const { expect } = require("chai");
const { ethers } = require("hardhat");

// Tests all functionality of the collateralized lending protocol

// Categorías de prueba:
// 1. Validación de implementación de tokens
// 2. Inicialización de protocolo
// 3. Gestión de garantías
// 4. Operaciones de préstamo
// 5. Cálculo de intereses
// 6. Flujos de trabajo de reembolso
// 7. Retiro de garantías
// 8. Funciones de visualización
// 9. Casos límite y seguridad
// 10. Cálculo del factor de salud    
// 11. Decimales de token                            
// Metodología de prueba:
// - Utiliza la manipulación EVM de Hardhat para pruebas basadas en tiempo
// - Verifica los cambios de estado mediante funciones de visualización
// - Comprueba las emisiones de eventos para operaciones críticas
// - Prueba las condiciones límite y los casos de error
// - Mantiene una cobertura del 100 % de la funcionalidad del contrato
describe("LendingProtocol", function () {
    let lendingProtocol;
    let collateralToken;
    let loanToken;
    let owner;
    let user1;
    let user2;

    // Setup before each test case

    // Flujo de trabajo:
    // 1. Obtener firmantes de prueba(propietario, usuario1, usuario2)
    // 2. Implementar tokens de garantía(cUSD) y de préstamo(dDAI)
    // 3. Implementar el protocolo de préstamo con las direcciones de los tokens
    // 4. Generar tokens de prueba:
    // - 1000 cUSD para el usuario1 y el usuario2
    // - 10000 dDAI para el protocolo de préstamo para liquidez
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const CollateralToken = await ethers.getContractFactory("CollateralToken");
        collateralToken = await CollateralToken.deploy();
        await collateralToken.waitForDeployment();

        const LoanToken = await ethers.getContractFactory("LoanToken");
        loanToken = await LoanToken.deploy();
        await loanToken.waitForDeployment();

        const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
        lendingProtocol = await LendingProtocol.deploy(
            await collateralToken.getAddress(),
            await loanToken.getAddress()
        );
        await lendingProtocol.waitForDeployment();

        await collateralToken.mint(user1.address, ethers.parseEther("1000"));
        await collateralToken.mint(user2.address, ethers.parseEther("1000"));
        await loanToken.mint(await lendingProtocol.getAddress(), ethers.parseEther("10000"));
    });

    // ========================
    // TOKEN DEPLOYMENT TESTS
    // ========================
    describe("Token Deployment", function () {
        it("Should deploy CollateralToken with correct name and symbol", async function () {
            expect(await collateralToken.name()).to.equal("Collateral USD");
            expect(await collateralToken.symbol()).to.equal("cUSD");
        });

        it("Should deploy LoanToken with correct name and symbol", async function () {
            expect(await loanToken.name()).to.equal("Debt DAI");
            expect(await loanToken.symbol()).to.equal("dDAI");
        });

        it("Should mint tokens correctly", async function () {
            const balance = await collateralToken.balanceOf(user1.address);
            expect(balance).to.equal(ethers.parseEther("1000"));
        });
    });

    // ==============================
    // PROTOCOL INITIALIZATION
    // ==============================
    describe("LendingProtocol Deployment", function () {
        it("Should set correct token addresses", async function () {
            expect(await lendingProtocol.collateralToken()).to.equal(await collateralToken.getAddress());
            expect(await lendingProtocol.loanToken()).to.equal(await loanToken.getAddress());
        });

        it("Should set correct constants", async function () {
            expect(await lendingProtocol.COLLATERALIZATION_RATIO()).to.equal(150);
            expect(await lendingProtocol.WEEKLY_INTEREST_RATE()).to.equal(5);
            expect(await lendingProtocol.SECONDS_PER_WEEK()).to.equal(604800);
        });
    });

    // ==============================
    // COLLATERAL MANAGEMENT TESTS
    // ==============================
    describe("Collateral Deposit", function () {
        it("Should deposit collateral successfully", async function () {
            const amount = ethers.parseEther("100");

            // Aprobar y depositar
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount);
            await expect(lendingProtocol.connect(user1).depositCollateral(amount))
                .to.emit(lendingProtocol, "CollateralDeposited")
                .withArgs(user1.address, amount);

            // Verificar actualización de estado
            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[0]).to.equal(amount); // collateral
        });

        it("Should revert when depositing zero amount", async function () {
            await expect(lendingProtocol.connect(user1).depositCollateral(0))
                .to.be.revertedWith("Amount must be > 0");
        });

        it("Should revert when insufficient allowance", async function () {
            const amount = ethers.parseEther("100");
            await expect(lendingProtocol.connect(user1).depositCollateral(amount))
                .to.be.reverted;
        });

        it("Should accumulate multiple deposits", async function () {
            const amount1 = ethers.parseEther("50");
            const amount2 = ethers.parseEther("30");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), amount1 + amount2);
            await lendingProtocol.connect(user1).depositCollateral(amount1);
            await lendingProtocol.connect(user1).depositCollateral(amount2);

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[0]).to.equal(amount1 + amount2);
        });
    });

    // =========================
    // LOAN OPERATION TESTS
    // =========================
    describe("Borrowing", function () {
        // Prueba previa: Depositar garantía para el usuario 1
        beforeEach(async function () {
            const collateralAmount = ethers.parseEther("150");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
        });

        it("Should borrow within collateralization limit", async function () {
            const borrowAmount = ethers.parseEther("100"); // 150 * 100/150 = 100 max

            await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
                .to.emit(lendingProtocol, "LoanBorrowed")
                .withArgs(user1.address, borrowAmount);

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[1]).to.equal(borrowAmount); // currentDebt
        });

        it("Should revert when borrowing zero amount", async function () {
            await expect(lendingProtocol.connect(user1).borrow(0))
                .to.be.revertedWith("Amount must be > 0");
        });

        it("Should revert when exceeding borrow limit", async function () {
            const borrowAmount = ethers.parseEther("101"); // Supera el 66.67% del collateral

            await expect(lendingProtocol.connect(user1).borrow(borrowAmount))
                .to.be.revertedWith("Exceeds borrow limit");
        });

        it("Should handle multiple borrows with interest accumulation", async function () {
            const borrowAmount1 = ethers.parseEther("50");
            const borrowAmount2 = ethers.parseEther("30");

            // Primer préstamo
            await lendingProtocol.connect(user1).borrow(borrowAmount1);

            // Simular el paso del tiempo de 1 semana
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            // Segundo préstamo (debe incluir los intereses acumulados)
            await lendingProtocol.connect(user1).borrow(borrowAmount2);

            const userData = await lendingProtocol.getUserData(user1.address);
            const expectedDebt = borrowAmount1 + (borrowAmount1 * 5n / 100n) + borrowAmount2; // 50 + 2.5 + 30 = 82.5
            expect(userData[1]).to.equal(expectedDebt);
        });

        it("Should not allow borrowing without collateral", async function () {
            const borrowAmount = ethers.parseEther("10");

            await expect(lendingProtocol.connect(user2).borrow(borrowAmount))
                .to.be.revertedWith("Exceeds borrow limit");
        });
    });

    // ==============================
    // INTEREST CALCULATION TESTS
    // ==============================
    describe("Interest Calculation", function () {
        beforeEach(async function () {
            const collateralAmount = ethers.parseEther("150");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
        });

        it("Should calculate interest correctly after 1 week", async function () {
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Adelantamos el tiempo exactamente 1 semana
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            const expectedDebt = borrowAmount + (borrowAmount * 5n / 100n); // 100 + 5 = 105
            expect(currentDebt).to.equal(expectedDebt);
        });

        it("Should calculate interest correctly after multiple weeks", async function () {
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Adelanto 3 semanas
            await ethers.provider.send("evm_increaseTime", [604800 * 3]);
            await ethers.provider.send("evm_mine");

            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            const expectedDebt = borrowAmount + (borrowAmount * 5n * 3n / 100n); // 100 + 15 = 115
            expect(currentDebt).to.equal(expectedDebt);
        });

        it("Should return zero interest for no debt", async function () {
            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            expect(currentDebt).to.equal(0);
        });

        it("Should not accumulate interest within same week", async function () {
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Semana parcial avanzada (300.000 segundos ≈ 3,47 días)
            await ethers.provider.send("evm_increaseTime", [300000]);
            await ethers.provider.send("evm_mine");

            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            expect(currentDebt).to.equal(borrowAmount);
        });
    });

    // ===========================
    // LOAN REPAYMENT TESTS
    // ===========================
    describe("Loan Repayment", function () {
        beforeEach(async function () {
            // Configurar el usuario1 con garantía y préstamo
            const collateralAmount = ethers.parseEther("150");
            const borrowAmount = ethers.parseEther("100");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Proporcionar fondos de reembolso
            await loanToken.mint(user1.address, ethers.parseEther("200"));
        });

        it("Should repay loan successfully", async function () {
            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);

            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), currentDebt);
            await expect(lendingProtocol.connect(user1).repay())
                .to.emit(lendingProtocol, "LoanRepaid")
                .withArgs(user1.address, currentDebt);

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[1]).to.equal(0);
        });

        it("Should repay loan with interest", async function () {
            // Adelanto del tiempo para devengar intereses
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            const expectedDebt = ethers.parseEther("105"); // 100 + 5% interés
            expect(currentDebt).to.equal(expectedDebt);

            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), currentDebt);
            await lendingProtocol.connect(user1).repay();

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[1]).to.equal(0);
        });

        it("Should revert when no debt to repay", async function () {
            // Primer pago
            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), currentDebt);
            await lendingProtocol.connect(user1).repay();

            //Intentar segundo reembolso
            await expect(lendingProtocol.connect(user1).repay())
                .to.be.revertedWith("No debt to repay");
        });

        it("Should revert when insufficient token balance", async function () {
            // Configurar el usuario2 con deuda pero sin fondos para pagar
            const collateralAmount = ethers.parseEther("150");
            const borrowAmount = ethers.parseEther("50");

            await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user2).depositCollateral(collateralAmount);
            await lendingProtocol.connect(user2).borrow(borrowAmount);

            // Intentar reembolso sin fondos
            await expect(lendingProtocol.connect(user2).repay())
                .to.be.reverted;
        });
    });

    // ================================
    // COLLATERAL WITHDRAWAL TESTS
    // ================================
    describe("Collateral Withdrawal", function () {
        beforeEach(async function () {
            // El usuario1 deposita garantía
            const collateralAmount = ethers.parseEther("150");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
        });

        it("Should withdraw collateral when no debt", async function () {
            const collateralAmount = ethers.parseEther("150");

            await expect(lendingProtocol.connect(user1).withdrawCollateral())
                .to.emit(lendingProtocol, "CollateralWithdrawn")
                .withArgs(user1.address, collateralAmount);

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[0]).to.equal(0);
        });

        it("Should revert when outstanding debt exists", async function () {
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            await expect(lendingProtocol.connect(user1).withdrawCollateral())
                .to.be.revertedWith("Outstanding debt");
        });

        it("Should revert when no collateral to withdraw", async function () {
            await expect(lendingProtocol.connect(user2).withdrawCollateral())
                .to.be.revertedWith("No collateral");
        });

        it("Should allow withdrawal after loan repayment", async function () {
            // Pedir prestado y devolver
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            await loanToken.mint(user1.address, ethers.parseEther("200"));
            const currentDebt = await lendingProtocol.getCurrentDebt(user1.address);
            await loanToken.connect(user1).approve(await lendingProtocol.getAddress(), currentDebt);
            await lendingProtocol.connect(user1).repay();

            // Retirar la garantía
            const collateralAmount = ethers.parseEther("150");
            await expect(lendingProtocol.connect(user1).withdrawCollateral())
                .to.emit(lendingProtocol, "CollateralWithdrawn")
                .withArgs(user1.address, collateralAmount);
        });
    });

    // =============================
    // VIEW FUNCTION TESTS
    // =============================
    describe("getUserData View Function", function () {
        it("Should return correct user data with no position", async function () {
            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[0]).to.equal(0); // collateral
            expect(userData[1]).to.equal(0); // currentDebt
            expect(userData[2]).to.equal(0); // interestAccrued
        });

        it("Should return correct user data with collateral only", async function () {
            const collateralAmount = ethers.parseEther("150");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[0]).to.equal(collateralAmount);
            expect(userData[1]).to.equal(0);
            expect(userData[2]).to.equal(0);
        });

        it("Should return correct user data with debt and interest", async function () {
            const collateralAmount = ethers.parseEther("150");
            const borrowAmount = ethers.parseEther("100");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Avanzar 1 semana
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            const userData = await lendingProtocol.getUserData(user1.address);
            expect(userData[0]).to.equal(collateralAmount);
            expect(userData[1]).to.equal(ethers.parseEther("105")); // 100 + 5% interés
            expect(userData[2]).to.equal(ethers.parseEther("5")); // 5% interés
        });
    });

    // ================================
    // EDGE CASE & SECURITY TESTS
    // ================================
    describe("Edge Cases and Security", function () {
        it("Should handle zero collateral borrow attempt", async function () {
            await expect(lendingProtocol.connect(user1).borrow(ethers.parseEther("1")))
                .to.be.revertedWith("Exceeds borrow limit");
        });

        it("Should handle exact collateralization limit", async function () {
            const collateralAmount = ethers.parseEther("150");
            const maxBorrowAmount = ethers.parseEther("100"); // 150 * 100/150

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);

            await expect(lendingProtocol.connect(user1).borrow(maxBorrowAmount))
                .to.not.be.reverted;
        });

        it("Should prevent borrowing beyond collateralization after interest accrual", async function () {
            const collateralAmount = ethers.parseEther("150");
            const borrowAmount = ethers.parseEther("90");

            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Simular el tiempo e intentar pedir prestado más
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            // Después de los intereses, la deuda se convierte en 94.5, por lo que el préstamo adicional máximo es 5.5
            await expect(lendingProtocol.connect(user1).borrow(ethers.parseEther("10")))
                .to.be.revertedWith("Exceeds borrow limit");
        });

        it("Should handle multiple users independently", async function () {
            const collateralAmount = ethers.parseEther("150");

            // usuario1
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
            await lendingProtocol.connect(user1).borrow(ethers.parseEther("50"));

            // usuario2
            await collateralToken.connect(user2).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user2).depositCollateral(collateralAmount);
            await lendingProtocol.connect(user2).borrow(ethers.parseEther("75"));

            // Verificar estado aislado
            const userData1 = await lendingProtocol.getUserData(user1.address);
            const userData2 = await lendingProtocol.getUserData(user2.address);

            expect(userData1[1]).to.equal(ethers.parseEther("50"));
            expect(userData2[1]).to.equal(ethers.parseEther("75"));
        });
    });

    // ================================
    // HEALTH FACTOR TESTS
    // ================================
    describe("Additional View Functions", function () {
        beforeEach(async function () {
            const collateralAmount = ethers.parseEther("150");
            await collateralToken.connect(user1).approve(await lendingProtocol.getAddress(), collateralAmount);
            await lendingProtocol.connect(user1).depositCollateral(collateralAmount);
        });

        it("Should calculate max borrowable correctly with no debt", async function () {
            const maxBorrowable = await lendingProtocol.getMaxBorrowable(user1.address);
            const expectedMax = ethers.parseEther("100"); // 150 * 100/150 = 100
            expect(maxBorrowable).to.equal(expectedMax);
        });

        it("Should calculate max borrowable correctly with existing debt", async function () {
            const borrowAmount = ethers.parseEther("50");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            const maxBorrowable = await lendingProtocol.getMaxBorrowable(user1.address);
            const expectedMax = ethers.parseEther("50"); // 100 - 50 = 50 restante
            expect(maxBorrowable).to.equal(expectedMax);
        });

        it("Should calculate max borrowable with interest accrued", async function () {
            const borrowAmount = ethers.parseEther("90");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Simular 1 semana para acumular intereses
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            const maxBorrowable = await lendingProtocol.getMaxBorrowable(user1.address);
            // Después de 1 semana: debt = 90 + 4.5 = 94.5, así que max borrowable = 100 - 94.5 = 5.5
            const expectedMax = ethers.parseEther("5.5");
            expect(maxBorrowable).to.equal(expectedMax);
        });

        it("Should return zero max borrowable when at limit", async function () {
            const maxBorrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(maxBorrowAmount);

            const maxBorrowable = await lendingProtocol.getMaxBorrowable(user1.address);
            expect(maxBorrowable).to.equal(0);
        });

        it("Should return zero max borrowable for user with no collateral", async function () {
            const maxBorrowable = await lendingProtocol.getMaxBorrowable(user2.address);
            expect(maxBorrowable).to.equal(0);
        });

        it("Should calculate health factor correctly with no debt", async function () {
            const healthFactor = await lendingProtocol.getHealthFactor(user1.address);
            expect(healthFactor).to.equal(ethers.MaxUint256);
        });

        it("Should calculate health factor correctly with debt", async function () {
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            const healthFactor = await lendingProtocol.getHealthFactor(user1.address);
            // Health factor = (collateral * 100) / (debt * collateralization_ratio / 100)
            // = (150 * 100) / (100 * 150 / 100) = 15000 / 150 = 100
            expect(healthFactor).to.equal(100);
        });

        it("Should calculate health factor with interest accrued", async function () {
            const borrowAmount = ethers.parseEther("100");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            // Simular 1 semana para acumular intereses
            await ethers.provider.send("evm_increaseTime", [604800]);
            await ethers.provider.send("evm_mine");

            const healthFactor = await lendingProtocol.getHealthFactor(user1.address);
            // Después de 1 semana: debt = 105, health factor = (150 * 100) / (105 * 150 / 100) = 15000 / 157.5 ≈ 95.24
            // Dado que utilizamos la división de enteros: 15000 / 157 = 95 (redondeado hacia abajo)
            expect(healthFactor).to.be.closeTo(95, 1);
        });

        it("Should calculate lower health factor with higher debt", async function () {
            const borrowAmount = ethers.parseEther("90");
            await lendingProtocol.connect(user1).borrow(borrowAmount);

            const healthFactor = await lendingProtocol.getHealthFactor(user1.address);
            // Health factor = (150 * 100) / (90 * 150 / 100) = 15000 / 135 ≈ 111.11
            expect(healthFactor).to.be.closeTo(111, 1);
        });

        it("Should return infinite health factor for user with no debt", async function () {
            // El usuario2 no tiene posición
            const healthFactor = await lendingProtocol.getHealthFactor(user2.address);
            expect(healthFactor).to.equal(ethers.MaxUint256);
        });

        it("Should handle edge case of very small debt", async function () {
            const smallBorrowAmount = ethers.parseEther("0.001");
            await lendingProtocol.connect(user1).borrow(smallBorrowAmount);

            const healthFactor = await lendingProtocol.getHealthFactor(user1.address);

            expect(healthFactor).to.be.greaterThan(100000);
            expect(healthFactor).to.be.lessThan(ethers.MaxUint256);
        });
    });

    // ================================
    // TOKEN DECIMALS TESTS
    // ================================
    describe("Token Decimals", function () {
        it("Should return correct decimals for CollateralToken", async function () {
            expect(await collateralToken.decimals()).to.equal(18);
        });

        it("Should return correct decimals for LoanToken", async function () {
            expect(await loanToken.decimals()).to.equal(18);
        });
    });
});