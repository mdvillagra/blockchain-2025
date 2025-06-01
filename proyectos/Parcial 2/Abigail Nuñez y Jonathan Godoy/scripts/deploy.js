async function main() {
    // Deployment Setup Phase
    // ----------------------
    // 1. Inicializar el proveedor de Ethereum usando el entorno de Hardhat
    // 2. Recuperar la cuenta del implementador de la billetera configurada
    // 3. Mostrar la dirección del implementador para verificación
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Contract Deployment Engine
    // --------------------------
    // 1. Cargar los artefactos del contrato y crear una instancia de fábrica
    // 2. Implementar un nuevo contrato de Marketplace en la blockchain
    // 3. Esperar la resolución de la instancia del contrato
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const market = await Marketplace.deploy();

    // Post-Deployment Verification
    // ----------------------------
    // 1. Recuperar y mostrar la dirección del contrato implementado
    // 2. Esperar la finalización de la transacción (confirmación del bloque)
    // 3. Registrar el bloque de implementación para fines de auditoría
    console.log("Contract address:", await market.getAddress());
    const deploymentReceipt = await market.deploymentTransaction().wait();
    console.log("Deployed in block:", deploymentReceipt.blockNumber);

    // Initial NFT Collection Setup
    // ----------------------------
    // 1. Definir la URI IPFS base para los metadatos (debe coincidir con el CID real)
    // 2. Generar una secuencia de 10 NFT con:
    // - Rutas de metadatos incrementales (de 0.json a 9.json)
    // - Precio fijo de 0,01 ETH (convertido a wei)
    // 3. Esperar la confirmación de cada transacción de generación
    // 4. Seguimiento del progreso mediante el registro de la consola
    const baseURI = "ipfs://QmNZ1iap6jNLWvZwkY85W3YgVQQVrGXcWE47bKFFT8nukp/";
    for (let i = 0; i < 10; i++) {
        const tx = await market.mintAndList(
            `${baseURI}${i}.json`,
            ethers.parseEther("0.01")
        );
        await tx.wait();
        console.log(`Minted NFT ${i + 1}/10`);
    }
}

// Execution and Error Handling
// ----------------------------
// 1. Ejecutar el flujo de trabajo de implementación principal
// 2. Detectar y mostrar cualquier error
// 3. Establecer el código de salida del proceso para la integración de CI/CD
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});