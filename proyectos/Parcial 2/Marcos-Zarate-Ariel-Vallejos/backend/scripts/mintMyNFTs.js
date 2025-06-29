const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Usando la cuenta para acuñar:", deployer.address);
  
  // Verificar el balance de la cuenta
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance de la cuenta:", ethers.formatEther(balance) + " ETH");

  if (balance === 0n) { // 0n es la forma de representar BigInt cero
    console.error("Error: La cuenta no tiene fondos. Por favor, añade ETH de prueba a esta cuenta en la red de destino.");
    process.exit(1);
  }

  // !!! REEMPLAZA ESTO con la dirección de tu contrato Marketplace desplegado en la red !!!
  const marketplaceAddress = "0x54bA0676f9E554c6072967d89D0f848cDaD2F394"; // Tu dirección real aquí, ¡esto está bien!
  
  // La condición if debe verificar el PLACEHOLDER original, no tu dirección real.
  if (marketplaceAddress === "TU_DIRECCION_DE_CONTRATO_MARKETPLACE_DESPLEGADO" || !marketplaceAddress || marketplaceAddress.length !== 42) {
    console.error("Error: Por favor, asegúrate de que 'marketplaceAddress' en el script sea la dirección válida de tu contrato desplegado (42 caracteres, incluyendo '0x') y no el placeholder.");
    process.exit(1);
  }

  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);
  console.log(`Conectado al contrato Marketplace en: ${await marketplace.getAddress()}`);

  // Estas son las URIs de los ARCHIVOS JSON de metadatos que subiste a IPFS
  // Asegúrate de que cada URI sea única y correcta para cada NFT
  const metadataURIs = [
    "ipfs://QmckiNy1m9qitmzRrwvcd1aKcLZa4XHCJdsdZDPghx2nbu", // Reemplaza con tus URIs reales
    "ipfs://QmdgfU9khpkwSeXip4MQQky2TNnLKoMWZUtyH7kHg4zw53",
    "ipfs://QmUtLRhBrXhHScxddBDpTyiFBDGrGx8MhBWEw4M6TrRHZH",
    "ipfs://QmcE3YnNAHTUGc8teKGVocxJNMw3pRkSzqe5z2WVEjkUm3",
    "ipfs://Qmd32T736BYodasBwRr9aBpwdkP5LDswVUGgnTEB8xUpU6",
    "ipfs://QmZNYKPKtV3iWzD1cGPTwSJag7Vxy8oiaUcyLPHwSna5ma",
    "ipfs://QmPhSmf9r51uEECjQSysnPmU35bcY2sSHZXshuKcV7ce6S",
    "ipfs://QmP37WuDub6cdgC5ihDRhKxm78eRYWY4hhT78dGHbzDGY7",
    "ipfs://QmTogpxugW4D1ZNLbT7nRqXSm7W3Q2XVvNvycN5KbpLwhr",
    "ipfs://QmZkBwRrmjoEDnjRCz5ib3HBrsJnezZjW1irE4SWXdjZ17",
  ];

  // Define el precio para los NFTs (puedes tener precios diferentes si lo deseas)
  const priceInEth = "0.01"; // Ejemplo: 0.01 ETH para todos
  const priceInWei = ethers.parseUnits(priceInEth, "ether");

  console.log(`\nAcuñando y listando ${metadataURIs.length} NFTs...`);

  for (let i = 0; i < metadataURIs.length; i++) {
    const uri = metadataURIs[i];
    // Simple validación para asegurar que la URI fue reemplazada
    if (!uri || uri === `ipfs://CID_DEL_JSON_PARA_NFT_${i + 1}` || !uri.startsWith("ipfs://")) {
        console.warn(`Advertencia: URI para NFT #${i + 1} parece no estar configurada correctamente o es un placeholder. Saltando. URI: ${uri}`);
        continue;
    }
    try {
      console.log(`Acuñando NFT #${i + 1} con URI: ${uri} y precio: ${priceInEth} ETH`);
      const tx = await marketplace.connect(deployer).mintAndList(uri, priceInWei);
      
      console.log(`  Transacción enviada para NFT #${i + 1}, esperando confirmación... Hash: ${tx.hash}`);
      // Espera a que la transacción sea minada (1 confirmación es usualmente suficiente para testnets)
      const receipt = await tx.wait(1); 

      let tokenIdMinted = "No se pudo determinar (revisa los logs manualmente)";
      if (receipt && receipt.logs) {
        const itemListedInterface = marketplace.interface; 
        for (const log of receipt.logs) {
          try {
            if (log.address.toLowerCase() === (await marketplace.getAddress()).toLowerCase()) {
              const parsedLog = itemListedInterface.parseLog({ topics: log.topics, data: log.data });
              if (parsedLog && parsedLog.name === "ItemListed") {
                tokenIdMinted = parsedLog.args.tokenId.toString();
                break; 
              }
            }
          } catch (e) {
            // Ignorar errores de parseo de logs que no son de nuestro evento
          }
        }
      }
      console.log(`  -> NFT #${i + 1} (Token ID: ${tokenIdMinted}) acuñado y listado! Recibo: ${receipt.transactionHash}`);

    } catch (error) {
      console.error(`Error al acuñar NFT #${i + 1} con URI ${uri}:`);
      if (error.reason) { // Ethers v6 a menudo incluye un 'reason'
        console.error("  Razón:", error.reason);
      }
      if (error.data) {
        console.error("  Error data:", error.data);
      }
      // Descomenta la siguiente línea para ver el objeto de error completo si es necesario
      // console.error("  Objeto de error completo:", error);
    }
  }
  console.log("\nProceso de acuñación completado.");
  try {
    const finalTokenCounter = await marketplace.tokenCounter();
    console.log(`Contador total de tokens en el contrato: ${finalTokenCounter.toString()}`);
  } catch (e) {
    console.error("No se pudo obtener el contador final de tokens del contrato.", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error fatal en el script:", error);
    process.exit(1);
  });