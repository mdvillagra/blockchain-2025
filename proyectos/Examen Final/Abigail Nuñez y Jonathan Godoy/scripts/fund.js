const hre = require("hardhat");
require('dotenv').config();

// Direcciones de contrato preconfiguradas de la implementación anterior
const dDAIAddress = process.env.VITE_DDAI_ADDRESS;
const cUSDAddress = process.env.VITE_CUSD_ADDRESS;
const lendingAddress = process.env.VITE_CONTRACT_ADDRESS;
const userAddress = process.env.VITE_USER_ADDRESS;

// ABI mínima para interactuar con contratos ERC20 con capacidad de acuñación
const ERC20_WITH_MINT_ABI = [
    "function transfer(address to, uint amount) returns (bool)",
    "function balanceOf(address account) view returns (uint)",
    "function mint(address to, uint amount)"
];

async function main() {
    console.log(" Starting protocol funding...\n");

    // VALIDACIÓN DE VARIABLES DE ENTORNO
    const requiredEnvVars = {
        'VITE_DDAI_ADDRESS': dDAIAddress,
        'VITE_CUSD_ADDRESS': cUSDAddress,
        'VITE_CONTRACT_ADDRESS': lendingAddress,
        'VITE_USER_ADDRESS': userAddress
    };

    const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        console.error(" Missing required environment variables:");
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.error("\n Please configure your .env file with the contract addresses");
        process.exit(1);
    }

    console.log("✅ Environment variables loaded successfully");

    // Inicializar firmante de transacción (normalmente propietario del contrato)
    // - Obtiene una billetera con privilegios de implementación
    // - Necesario para generar tokens y transferir fondos
    const [deployer] = await hre.ethers.getSigners();
    console.log(" Funding from account:", deployer.address);
    console.log(" Target user address:", userAddress);

    // Crear instancias de contrato para la interacción del token
    // Vinculaciones de contratos de token:
    // - Crea envoltorios de JavaScript para contratos de token en cadena
    // - Utiliza una ABI mínima para reducir la complejidad
    // - Se conecta con el firmante para operaciones privilegiadas
    const dDAI = new hre.ethers.Contract(dDAIAddress, ERC20_WITH_MINT_ABI, deployer);
    const cUSD = new hre.ethers.Contract(cUSDAddress, ERC20_WITH_MINT_ABI, deployer);

    // Definiciones de cantidades de tokens (en wei)
    const dDAIAmount = hre.ethers.parseUnits("10000", 18);
    const cUSDAmount = hre.ethers.parseUnits("5000", 18);

    console.log(" Amounts to fund:");
    console.log(`   - dDAI for contract: ${hre.ethers.formatUnits(dDAIAmount, 18)} dDAI`);
    console.log(`   - cUSD for user: ${hre.ethers.formatUnits(cUSDAmount, 18)} cUSD\n`);

    try {
        // LIQUIDITY PROVISION PHASE
        console.log("  Funding protocol with liquidity...");

        const initialBalance = await dDAI.balanceOf(lendingAddress);
        console.log(`   Initial contract balance: ${hre.ethers.formatUnits(initialBalance, 18)} dDAI`);

        if (initialBalance < dDAIAmount) {
            // Contrato de préstamo de fondos con activos prestables
            // Acuñación de Liquidez de dDAI:
            // - Crea nuevos tokens de préstamo directamente en la billetera del propietario
            // - Evita el proceso normal de préstamo para la inicialización del protocolo
            console.log("   Minting dDAI for liquidity...");
            const tx0 = await dDAI.mint(deployer.address, dDAIAmount);
            await tx0.wait();
            console.log("    dDAI minted successfully");

            // Inyección de capital del protocolo:
            // - Transfiere los dDAI generados al contrato de préstamo
            // - Crea un fondo para préstamos de usuarios
            // - Requerido antes de que se puedan emitir préstamos
            console.log("   Transferring dDAI to lending contract...");
            const tx1 = await dDAI.transfer(lendingAddress, dDAIAmount);
            await tx1.wait();
            console.log("    Transfer to contract successful\n");
        } else {
            console.log("     Contract already has sufficient liquidity\n");
        }

        // USER FUNDING PHASE
        console.log(" Funding user account...");

        const userCurrentBalance = await cUSD.balanceOf(userAddress);
        console.log(`   Current user balance: ${hre.ethers.formatUnits(userCurrentBalance, 18)} cUSD`);

        if (userCurrentBalance < cUSDAmount) {
            // Proporcionar garantía de prueba al usuario
            // Creación de tokens de garantía:
            // - Genera tokens de garantía de prueba para las operaciones del usuario
            // - Simula la adquisición de usuarios a través de medios externos
            // - Mantiene una relación 1:1 con dDAI según las reglas del protocolo
            console.log("   Minting cUSD for collateral...");
            const tx2 = await cUSD.mint(deployer.address, cUSDAmount);
            await tx2.wait();
            console.log("    cUSD minted successfully");

            if (userAddress.toLowerCase() !== deployer.address.toLowerCase()) {
                // Aprovisionamiento de cuenta de usuario:
                // - Financia al usuario objetivo con tokens de garantía
                // - Habilita llamadas a depositCollateral() en la DApp
                // - Permite la simulación de préstamos
                console.log("   Transferring cUSD to user...");
                const tx3 = await cUSD.transfer(userAddress, cUSDAmount);
                await tx3.wait();
                console.log("    Transfer to user successful\n");
            } else {
                console.log("     User is deployer, no transfer needed\n");
            }
        } else {
            console.log("     User already has sufficient collateral\n");
        }

        // VERIFICATION PHASE
        console.log(" Verifying final balances...");

        // Confirmar transferencias de fondos exitosas
        // Validación de estado:
        // - Verifica el saldo de tokens en la cadena
        // - Verifica el capital de préstamo recibido en el contrato
        // - Confirma que el usuario recibió los fondos de garantía
        const finalContractBalance = await dDAI.balanceOf(lendingAddress);
        const finalUserBalance = await cUSD.balanceOf(userAddress);

        console.log(" FINAL SUMMARY:");
        console.log(`   Contract dDAI: ${hre.ethers.formatUnits(finalContractBalance, 18)} dDAI`);
        console.log(`   User cUSD: ${hre.ethers.formatUnits(finalUserBalance, 18)} cUSD`);

        const minRequiredLiquidity = hre.ethers.parseUnits("1000", 18);
        const minRequiredCollateral = hre.ethers.parseUnits("100", 18);

        if (finalContractBalance >= minRequiredLiquidity && finalUserBalance >= minRequiredCollateral) {
            console.log("\n FUNDING COMPLETED SUCCESSFULLY");
            console.log(" Protocol is ready for loan operations");
        } else {
            console.log("\n  WARNING: Insufficient funds for operations");
        }

    } catch (error) {
        console.error("\n ERROR during funding:");
        console.error("Details:", error.message);
        throw error;
    }
}

main()
    .then(() => {
        console.log("\n Completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n CRITICAL FAILURE:");
        console.error(error);
        process.exit(1);
    });