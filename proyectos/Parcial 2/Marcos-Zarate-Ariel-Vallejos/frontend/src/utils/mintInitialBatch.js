import { ethers } from "ethers";
import MarketplaceABI from "../abis/Marketplace.json";
import toast from "react-hot-toast";


export async function mintInitialBatch() {
  // Toast ID para actualizar el toast principal
  let mainToastId = null;
  
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      toast.error("MetaMask no está instalado. Por favor, instala MetaMask para usar esta función.");
      throw new Error("MetaMask not installed. Please install MetaMask to use this feature.");
    }

    mainToastId = toast.loading("Iniciando proceso de acuñación...");

    // Request account access
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const userAddress = accounts[0];
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Check account balance
    const balance = await provider.getBalance(userAddress);
    const balanceEth = ethers.formatEther(balance);
    
    toast.loading(`Balance de la cuenta: ${balanceEth} ETH`, { id: mainToastId });

    if (balance === 0n) {
      toast.error("Tu cuenta no tiene fondos. Por favor, añade ETH de prueba para continuar.", { id: mainToastId });
      throw new Error("Your account has no funds. Please add test ETH to continue.");
    }

    // Replace with your deployed marketplace address
    const marketplaceAddress = "0x54bA0676f9E554c6072967d89D0f848cDaD2F394";
    
    if (!marketplaceAddress || marketplaceAddress.length !== 42) {
      toast.error("Dirección del contrato no válida", { id: mainToastId });
      throw new Error("Invalid marketplace contract address");
    }

    // Connect to the marketplace contract
    const marketplace = new ethers.Contract(marketplaceAddress, MarketplaceABI, signer);
    toast.loading(`Conectado al Marketplace en: ${marketplaceAddress}`, { id: mainToastId });

    // IPFS metadata URIs for the NFTs
    const metadataURIs = [
      "ipfs://QmckiNy1m9qitmzRrwvcd1aKcLZa4XHCJdsdZDPghx2nbu",
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

    // Price for all NFTs
    const priceInEth = "0.01";
    const priceInWei = ethers.parseUnits(priceInEth, "ether");

    toast.loading(`Acuñando ${metadataURIs.length} NFTs a ${priceInEth} ETH cada uno...`, { id: mainToastId });
    
    const mintedTokens = [];
    const errors = [];

    for (let i = 0; i < metadataURIs.length; i++) {
      const uri = metadataURIs[i];
      
      // Validate URI
      if (!uri || !uri.startsWith("ipfs://")) {
        const error = `URI no válido para NFT #${i + 1}: ${uri}`;
        toast.error(error);
        errors.push(error);
        continue;
      }
      
      try {
        toast.loading(`Acuñando NFT #${i + 1} de ${metadataURIs.length}...`, { id: mainToastId });
        
        // Mint and list the NFT
        const tx = await marketplace.mintAndList(uri, priceInWei);
        toast.loading(`Transacción enviada para NFT #${i + 1}, esperando confirmación...`, { id: mainToastId });
        
        // Wait for transaction to be mined
        const receipt = await tx.wait(1);
        
        // Extract token ID from event logs
        let tokenIdMinted = null;
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              // Try to parse the log as an ItemListed event
              const parsedLog = marketplace.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              
              if (parsedLog && parsedLog.name === "ItemListed") {
                tokenIdMinted = parsedLog.args.tokenId.toString();
                break;
              }
            } catch (e) {
              // Ignore parsing errors for logs that don't match our event
            }
          }
        }
        
        const successMsg = `NFT #${i + 1} (Token ID: ${tokenIdMinted}) acuñado y listado!`;
        toast.success(successMsg);
        mintedTokens.push(tokenIdMinted);
        
      } catch (error) {
        const errorMsg = `Error al acuñar NFT #${i + 1}: ${error.reason || error.message || "Error desconocido"}`;
        toast.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Get final token count
    try {
      const finalTokenCounter = await marketplace.tokenCounter();
      toast.loading(`Total de tokens en el contrato: ${finalTokenCounter.toString()}`, { id: mainToastId });
    } catch (e) {
      toast.error(`No se pudo obtener el contador final de tokens: ${e.message}`);
    }

    // Final toast message
    if (mintedTokens.length > 0) {
      toast.success(`¡Acuñación completada! ${mintedTokens.length} de ${metadataURIs.length} NFTs acuñados exitosamente.`, {
        id: mainToastId,
        duration: 5000
      });
    } else {
      toast.error(`La acuñación falló. No se crearon NFTs.`, {
        id: mainToastId,
        duration: 5000
      });
    }

    return {
      success: mintedTokens.length > 0,
      mintedTokens,
      errors
    };
    
  } catch (error) {
    // If there's any uncaught error, show it in a toast
    toast.error(`Error: ${error.message || "Error desconocido"}`, {
      id: mainToastId, 
      duration: 4000 
    });
    throw error;
  }
}