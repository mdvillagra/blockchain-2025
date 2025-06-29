const { expect } = require("chai");
const { ethers } = require("hardhat");

// Test suite principal para el contrato LendingProtocol
describe("LendingProtocol", function () {
  let deployer, user;               // Cuentas de prueba
  let CollateralToken, LoanToken;  // Factories de los contratos ERC20
  let Protocol;                    // Factory del contrato principal
  let cUSD, dDAI, protocol;        // Instancias desplegadas

  // Se ejecuta antes de cada test
  beforeEach(async function () {
    // Obtiene dos cuentas: una como owner y otra como usuario
    [deployer, user] = await ethers.getSigners();

    // Despliega el token cUSD con el deployer como owner
    CollateralToken = await ethers.getContractFactory("CollateralToken");
    cUSD = await CollateralToken.deploy(deployer.address);
    await cUSD.waitForDeployment();

    // Despliega el token dDAI con el deployer como owner
    LoanToken = await ethers.getContractFactory("LoanToken");
    dDAI = await LoanToken.deploy(deployer.address);
    await dDAI.waitForDeployment();

    // Despliega el contrato principal LendingProtocol con referencias a ambos tokens
    Protocol = await ethers.getContractFactory("LendingProtocol");
    protocol = await Protocol.deploy(await cUSD.getAddress(), await dDAI.getAddress());
    await protocol.waitForDeployment();

    // El deployer mintea tokens a la cuenta del usuario para testear
    await cUSD.mint(user.address, ethers.parseEther("1000"));
    await dDAI.mint(user.address, ethers.parseEther("1000"));
    // Mint tokens para el protocolo (para que pueda prestar dDAI)
    await dDAI.mint(await protocol.getAddress(), ethers.parseEther("100000"));

  });

  // Test 1: Verifica que el usuario pueda depositar colateral correctamente
  it("permite depositar colateral", async function () {
    await cUSD.connect(user).approve(await protocol.getAddress(), ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));

    const [collateral, debt, interest] = await protocol.getUserData(user.address);
    expect(collateral).to.equal(ethers.parseEther("300"));
    expect(debt).to.equal(0);
    expect(interest).to.equal(0);
  });

  // Test 2: Verifica que no se pueda depositar colateral con monto cero
  it("no permite depositar colateral con monto cero", async function () {
    await cUSD.connect(user).approve(protocol, 0);
    await expect(
      protocol.connect(user).depositCollateral(0)
    ).to.be.revertedWith("Monto invalido");
  });


  // Test 2: Verifica que se pueda pedir un préstamo si no excede el 66% del colateral
  it("permite pedir préstamo hasta el 66% del colateral", async function () {
    await cUSD.connect(user).approve(protocol, ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));
    await protocol.connect(user).borrow(ethers.parseEther("198")); // 66%

    const [_, debt, interest] = await protocol.getUserData(user.address);
    expect(debt).to.equal(ethers.parseEther("198"));
    expect(interest).to.equal(ethers.parseEther("9.9")); // 5% de interés fijo
  });

  // Test 3: Verifica que NO se pueda pedir más del 66% de préstamo
  it("rechaza préstamo que excede el ratio", async function () {
    await cUSD.connect(user).approve(protocol, ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));

    await expect(
      protocol.connect(user).borrow(ethers.parseEther("250")) // demasiado
    ).to.be.revertedWith("Excede el colateral disponible");
  });

  // Test 4: Verifica que no se pueda pedir un segundo préstamo si ya hay deuda activa
  it("no permite pedir un segundo préstamo si ya hay deuda activa", async function () {
    await cUSD.connect(user).approve(protocol, ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));

    await protocol.connect(user).borrow(ethers.parseEther("100"));

    await expect(
      protocol.connect(user).borrow(ethers.parseEther("50"))
    ).to.be.revertedWith("Debe pagar su deuda actual");
  });

  // Test 4: Verifica que se pueda repagar un préstamo y limpiar deuda/interés
  it("permite repagar y limpiar la deuda", async function () {
    await cUSD.connect(user).approve(protocol, ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));
    await protocol.connect(user).borrow(ethers.parseEther("198"));

    // Calcula el total a pagar con interés del 5%
    const total = (ethers.parseEther("198") * 105n) / 100n; // 198 + 5%

    await dDAI.connect(user).approve(protocol, total);
    await protocol.connect(user).repay();

    const [_, debt, interest] = await protocol.getUserData(user.address);
    expect(debt).to.equal(0);
    expect(interest).to.equal(0);
  });

  // Test 5: Verifica que no se pueda repagar si no hay deuda
  it("no permite repagar si no hay deuda", async function () {
    await expect(
      protocol.connect(user).repay()
    ).to.be.revertedWith("No hay deuda");
  });


  // Test 6: Verifica que no se pueda retirar colateral con deuda pendiente
  it("no permite retirar colateral con deuda activa", async function () {
    await cUSD.connect(user).approve(protocol, ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));
    await protocol.connect(user).borrow(ethers.parseEther("100"));

    await expect(
      protocol.connect(user).withdrawCollateral()
    ).to.be.revertedWith("Deuda pendiente");
  });

  // Test 7: Verifica que se pueda retirar colateral si no hay deuda
  it("permite retirar colateral si no hay deuda", async function () {
    await cUSD.connect(user).approve(protocol, ethers.parseEther("300"));
    await protocol.connect(user).depositCollateral(ethers.parseEther("300"));
    await protocol.connect(user).borrow(ethers.parseEther("150"));

    const total = (ethers.parseEther("150") * 105n) / 100n; // 150 + 5%
    await dDAI.connect(user).approve(protocol, total);
    await protocol.connect(user).repay();

    await protocol.connect(user).withdrawCollateral();

    const [collateral] = await protocol.getUserData(user.address);
    expect(collateral).to.equal(0); // Confirmamos que retiró todo
  });

  // Test 8: No permite retirar colateral si no hay colateral depositado
  it("no permite retirar colateral si no hay colateral depositado", async function () {
    await expect(
      protocol.connect(user).withdrawCollateral()
    ).to.be.revertedWith("No hay colateral");
  });


});
