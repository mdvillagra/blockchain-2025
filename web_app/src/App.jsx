import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import MarketplaceABI from "artifacts/contracts/Marketplace.sol/Marketplace.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [items, setItems] = useState([]);
  const [hasMinted, setHasMinted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Para feedback visual

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_RPC_URL;

  console.log("App Render. Items:", items.length, "Account:", currentAccount, "HasMinted:", hasMinted, "IsLoading:", isLoading);

  async function connectWallet() {
    console.log("connectWallet: Attempting to connect...");
    if (!window.ethereum) return alert("Instala MetaMask");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      console.log("connectWallet: Wallet connected, account set:", accounts[0]);
      // loadMarketItems se llamará por useEffect
    } catch (error) {
      console.error("connectWallet: Error:", error);
    }
  }

  function getContract(signerOrProvider) {
    if (!contractAddress) {
      console.error("getContract: VITE_CONTRACT_ADDRESS is not set!");
      alert("Dirección del contrato no configurada. Revisa variables de entorno.");
      return null;
    }
    console.log("getContract: Creating contract instance for address", contractAddress);
    return new ethers.Contract(contractAddress, MarketplaceABI.abi, signerOrProvider);
  }

  async function loadMarketItems() {
    console.log("loadMarketItems: Initiated.");
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl); // Usar JsonRpcProvider para lecturas
      const contract = getContract(provider);
      if (!contract) {
        console.error("loadMarketItems: Contract instance is null.");
        setIsLoading(false);
        setItems([]); // Limpiar items si no hay contrato
        return;
      }

      let latestTokenId = 0;
      try {
        const latestIdBigInt = await contract.getLatestTokenId(); // Llama a la nueva función del contrato
        latestTokenId = Number(latestIdBigInt); // Convierte de BigInt a Number
        console.log(`loadMarketItems: Fetched latestTokenId from contract: ${latestTokenId}`);
      } catch (error) {
        console.error("loadMarketItems: Could not fetch latestTokenId from contract.", error);
        // Fallback o manejo de error si no se puede obtener el ID más reciente
        // Podrías optar por no cargar nada o mostrar un error.
        // Por ahora, si falla, no intentará cargar items.
        setIsLoading(false);
        setItems([]);
        return;
      }
      
      if (latestTokenId === 0) {
          console.log("loadMarketItems: No tokens minted yet (latestTokenId is 0).");
          setItems([]); // Asegurarse de que la lista esté vacía si no hay tokens
          setIsLoading(false);
          return;
      }

      const fetched = [];
      console.log(`loadMarketItems: Will iterate from tokenId 1 to ${latestTokenId}`);

      // Crear un array de promesas para obtener los listings en paralelo
      const listingPromises = [];
      for (let tokenId = 1; tokenId <= latestTokenId; tokenId++) {
          listingPromises.push(
              contract.getListing(tokenId)
                .then(listingData => ({ // Envolver el resultado con el tokenId
                    id: tokenId,
                    data: listingData,
                    success: true
                }))
                .catch(err => {
                    console.error(`loadMarketItems: Error calling getListing for tokenId ${tokenId}:`, err.message);
                    return { id: tokenId, success: false, error: err.message }; // Devolver error para este token
                })
          );
      }

      // Esperar a que todas las promesas se resuelvan
      const results = await Promise.all(listingPromises);

      for (const result of results) {
          if (!result.success) {
              // Ya se logueó el error específico, puedes decidir si hacer algo más aquí
              console.log(`loadMarketItems: Skipping tokenId ${result.id} due to previous error.`);
              continue;
          }

          const tokenId = result.id;
          const listingData = result.data; // [seller, price, isSold]
          const seller = listingData[0];
          const price = listingData[1];
          const isSold = listingData[2];

          console.log(`loadMarketItems: Data for tokenId ${tokenId} -> Seller: ${seller}, Price: ${ethers.formatEther(price)} ETH, IsSold: ${isSold}`);

          if (!isSold && seller !== ethers.ZeroAddress) {
            // TODO: URI real desde el contrato (ej. contract.tokenURI(tokenId))
            const placeholderUri = `https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png`;
            // const actualTokenURI = await contract.tokenURI(tokenId); // Descomentar si tienes esta función y quieres la URI real

            fetched.push({ 
              tokenId: String(tokenId),
              seller, 
              price, 
              uri: placeholderUri // Reemplazar con actualTokenURI cuando esté disponible
            });
            console.log(`loadMarketItems: TokenId ${tokenId} IS VALID and added to fetched list.`);
          } else {
            console.log(`loadMarketItems: TokenId ${tokenId} is either SOLD or NOT VALIDLY LISTED (Seller: ${seller}, IsSold: ${isSold}).`);
          }
      }

      console.log("loadMarketItems: Fetched array before setItems:", fetched);
      setItems(fetched);
      console.log("loadMarketItems: Finished successfully.");

    } catch (err) {
      console.error("loadMarketItems: General error:", err);
      // Considera limpiar items o mostrar un error global si la carga falla catastróficamente
      setItems([]); 
    } finally {
      setIsLoading(false);
    }
  }

  async function purchase(tokenId, price) {
    console.log(`purchase: Initiated for tokenId: ${tokenId}, price: ${ethers.formatEther(price)} ETH`);
    if (!currentAccount) {
      console.log("purchase: No current account, calling connectWallet.");
      return connectWallet();
    }
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      if (!contract) {
        console.error("purchase: Contract instance is null.");
        setIsLoading(false);
        return;
      }

      console.log(`purchase: Calling contract.buy(${tokenId}) with value (wei): ${price.toString()}`);
      const tx = await contract.buy(tokenId, { value: price });
      console.log(`purchase: Transaction sent for tokenId ${tokenId}. Hash: ${tx.hash}. Waiting for confirmation...`);
      await tx.wait();
      console.log(`purchase: Transaction for tokenId ${tokenId} Mined!`);
      
      alert(`¡Compra exitosa del NFT #${tokenId}!`);

      console.log("purchase: Calling loadMarketItems to refresh UI...");
      await loadMarketItems();
      console.log("purchase: Finished successfully.");
    } catch (err) {
      console.error(`purchase: Error for tokenId ${tokenId}:`, err.reason || err.message || err);
      alert(`Error en la compra: ${err.reason || err.message || "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function mintInitialBatch() {
    console.log("mintInitialBatch: Initiated for batch minting.");
    if (!currentAccount) {
      console.log("mintInitialBatch: No current account, calling connectWallet.");
      return connectWallet();
    }
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer); // Asegúrate que getContract devuelve la instancia con signer
      if (!contract) {
        console.error("mintInitialBatch: Contract instance is null.");
        setIsLoading(false);
        return;
      }

      const MINT_COUNT = 10;
      const uris = [];
      const prices = [];

      console.log(`mintInitialBatch: Preparing ${MINT_COUNT} NFTs for batch minting.`);
      for (let i = 1; i <= MINT_COUNT; i++) {
        // TODO: Genera URIs únicas y significativas para cada NFT.
        // Usar solo `i` en la URI puede llevar a metadatos duplicados si minteas más lotes.
        // Una mejor aproximación podría ser generar URIs que incluyan el futuro tokenId
        // o tener un sistema de metadatos más robusto.
        // Por ahora, para que funcione, podemos hacer esto simple:
        const currentTotalSupply = Number(await contract.getLatestTokenId());
        const futureTokenId = currentTotalSupply + i;
        uris.push(`ipfs://your_metadata_folder_hash/${futureTokenId}.json`); // Ejemplo de URI única
        prices.push(ethers.parseEther("0.01")); // Ejemplo de precio
      }
      
      console.log("mintInitialBatch: URIs prepared:", uris);
      console.log("mintInitialBatch: Prices prepared:", prices.map(p => ethers.formatEther(p) + " ETH"));

      console.log("mintInitialBatch: Calling contract.batchMintAndList...");
      const tx = await contract.batchMintAndList(uris, prices);
      console.log(`mintInitialBatch: Batch transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
      await tx.wait();
      console.log(`mintInitialBatch: Batch transaction Mined!`);
      
      setHasMinted(true); // O alguna otra lógica para controlar el botón
      alert(`${MINT_COUNT} NFTs minteados y listados en lote con éxito!`);

      console.log("mintInitialBatch: Calling loadMarketItems to refresh UI...");
      await loadMarketItems(); // Actualizar la lista de NFTs
      console.log("mintInitialBatch: Finished successfully.");

    } catch (err) {
      console.error("mintInitialBatch: Error:", err.reason || err.message || err);
      let displayError = "Error al mintear el lote inicial.";
      if (err.data && err.data.message) { // Errores de Hardhat/ethers a veces vienen aquí
        displayError += ` Detalles: ${err.data.message}`;
      } else if (err.reason) {
        displayError += ` Razón: ${err.reason}`;
      } else if (err.message) {
        displayError += ` Mensaje: ${err.message}`;
      }
      alert(displayError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    console.log("useEffect [currentAccount]: Triggered. currentAccount:", currentAccount);
    if (currentAccount) {
      loadMarketItems();
    } else {
      setItems([]); // Limpiar items si no hay cuenta
    }
    // Listener para cambios de cuenta en Metamask
    const handleAccountsChanged = (accounts) => {
        console.log("MetaMask accountsChanged event:", accounts);
        if (accounts.length === 0) {
            console.log("MetaMask is locked or the user has disconnected all accounts");
            setCurrentAccount(null); // Esto disparará el useEffect de nuevo
        } else if (accounts[0] !== currentAccount) {
            setCurrentAccount(accounts[0]); // Esto disparará el useEffect de nuevo
        }
    };

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // Limpieza del listener
        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
    }
  }, [currentAccount]);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-100">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-700">NFT Marketplace</h1>

        {!currentAccount ? (
          <button onClick={connectWallet} disabled={isLoading} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-lg font-semibold transition duration-150 ease-in-out disabled:opacity-50">
            {isLoading ? "Conectando..." : "Conectar Wallet"}
          </button>
        ) : (
          <div className="mb-6 p-4 bg-gray-200 rounded-md text-center">
            <p className="text-sm text-gray-700">Wallet Conectada:</p>
            <p className="text-md font-mono break-all">{currentAccount}</p>
          </div>
        )}

        {currentAccount && !hasMinted && (
          <button onClick={mintInitialBatch} disabled={isLoading} className="w-full mb-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md text-lg font-semibold transition duration-150 ease-in-out disabled:opacity-50">
            {isLoading ? "Minteando Lote..." : "Mint & List Inicial (10 NFTs)"}
          </button>
        )}
        
        {isLoading && <div className="text-center my-5 text-xl text-blue-500">Cargando NFTs... ⏳</div>}

        {!isLoading && items.length === 0 && currentAccount && (
            <p className="text-center text-gray-500 my-8 text-lg">😕 No hay NFTs disponibles en este momento. {currentAccount && !hasMinted ? "Intenta mintear el lote inicial." : ""}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <div 
              key={item.tokenId} 
              className="flex flex-col border border-gray-300 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white overflow-hidden"
            >
              <img
                src={item.uri.startsWith("ipfs://") ? item.uri.replace("ipfs://", "https://ipfs.io/ipfs/") : item.uri}
                alt={`NFT ${item.tokenId}`}
                className="mb-4 w-full h-56 object-cover rounded-md border"
                onError={(e) => { e.target.onerror = null; e.target.src="https://www.pngkey.com/png/detail/233-2332677_image-500580-placeholder-transparent.png"; }}
              />
              <div className="text-center flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-purple-700 mb-1">NFT ID: {item.tokenId}</h3>
                  <p className="text-lg text-gray-800 mb-3">Precio: {ethers.formatEther(item.price)} ETH</p>
                </div>
                {currentAccount && (
                  <button
                    onClick={() => purchase(item.tokenId, item.price)}
                    disabled={isLoading || item.seller.toLowerCase() === currentAccount.toLowerCase()}
                    className="w-full mt-auto px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-md font-semibold transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Procesando..." : (item.seller.toLowerCase() === currentAccount.toLowerCase() ? "Eres el dueño" : "Comprar")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}