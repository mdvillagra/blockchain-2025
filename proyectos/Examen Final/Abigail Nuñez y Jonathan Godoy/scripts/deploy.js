const hre = require("hardhat");

async function main() {
    // TOKEN DEPLOYMENT PHASE

    // Implementa el contrato del token de garantía (cUSD)
    // - Crea una instancia del token ERC20 utilizado para depósitos de garantía
    // - Implementa el contrato en la red de pruebas de Ephemery
    // - Almacena la dirección del contrato para su posterior consulta en el protocolo de préstamo
    const CollateralToken = await hre.ethers.getContractFactory("CollateralToken");
    const cUSD = await CollateralToken.deploy();
    await cUSD.waitForDeployment();
    const cUSDAddress = await cUSD.getAddress();

    // Implementa el contrato de token de préstamo(dDAI)
    // - Crea el token ERC20 que los usuarios tomarán prestado.
    // - La implementación independiente garantiza un aislamiento adecuado de la tokenómica.
    // - La dirección se incorporará al protocolo de préstamo para el seguimiento de la deuda.
    const LoanToken = await hre.ethers.getContractFactory("LoanToken");
    const dDAI = await LoanToken.deploy();
    await dDAI.waitForDeployment();
    const dDAIAddress = await dDAI.getAddress();

    // LENDING PROTOCOL DEPLOYMENT

    // Implementación del contrato de préstamo principal:
    // - Inicializa el protocolo con ambas direcciones de token
    // - Establece una tasa de intercambio fija de 1: 1 entre tokens
    // - Establece requisitos de colateralización(150 %) y reglas de interés
    // - Implementa una instancia de contrato inmutable en la blockchain
    const LendingProtocol = await hre.ethers.getContractFactory("LendingProtocol");
    const lending = await LendingProtocol.deploy(cUSDAddress, dDAIAddress);
    await lending.waitForDeployment();
    const lendingAddress = await lending.getAddress();

    console.log("cUSD deployed to:", cUSDAddress);
    console.log("dDAI deployed to:", dDAIAddress);
    console.log("LendingProtocol deployed to:", lendingAddress);

    // PROTOCOL INITIALIZATION

    // Contrato de préstamo de fondos con reservas de dDAI
    // Capitalización del Protocolo:
    // - Genera liquidez inicial para el fondo de préstamos
    // - Se crean 10,000 tokens dDAI y se depositan en el contrato de préstamos
    // - Garantiza que el protocolo tenga fondos para atender las solicitudes de préstamo
    // - Se utiliza una capacidad de acuñación restringida (solo para el propietario)
    const tx = await dDAI.mint(lendingAddress, hre.ethers.parseEther("10000"));
    await tx.wait();

    console.log("Minted 10000 dDAI to lending contract");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});