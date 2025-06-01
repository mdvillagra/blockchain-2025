import { useEffect, useState } from "react";
import { ethers } from "ethers";
import MarketplaceABI from "./MarketplaceABI.json";
import Marketplace from "./Marketplace.jsx";

// Direccion del contrato
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [marketItems, setMarketItems] = useState([]);
  const [withdrawableBalance, setWithdrawableBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);


  /**
   * Conecta la wallet del usuario utilizando MetaMask.
   * Establece provider, signer y contrato.
   */
  async function connectWallet() {
    try {
      setIsLoading(true);
      if (window.ethereum) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await ethProvider.send("eth_requestAccounts", []);
        setCurrentAccount(accounts[0]);
        const signer = await ethProvider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MarketplaceABI, signer);
        setProvider(ethProvider);
        setSigner(signer);
        setContract(contract);
    } else {
      alert("Instala MetaMask");
    }
    } catch (error) {
      console.error("Error al conectar la wallet:", error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Obtiene todos los NFTs listados en el marketplace y sus metadatos.
   */
  async function loadMarketItems() {
    if (!contract) return;
    const items = [];
    setIsLoading(true);
    for (let i = 0; i <= 10; i++) { 
      try {
        const [seller, price, isSold] = await contract.getListing(i);
        if (seller !== ethers.ZeroAddress) {
          let tokenUri = await contract.tokenURI(i);
          if (tokenUri.startsWith("ipfs://")) {
            tokenUri = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
          }
          const response = await fetch(tokenUri);
          const metadata = await response.json();
          const imageUrl = ipfsToHttp(metadata.image);
          items.push({  tokenId: i, 
                        seller, 
                        price, 
                        isSold, 
                        image: imageUrl, 
                        name: metadata.name  });
        }
      } catch (err) {
        continue;
      }
    }
    setMarketItems(items);
    setIsLoading(false);
  }

  /**
   * Compra un NFT del marketplace.
   * Se le pasa el ID del NFT a comprar y el precio del NFT a comprar.
   */
  async function purchase(tokenId, price) {
    if (!contract) return;
    setIsLoading(true);
    const tx = await contract.buy(tokenId, { value: price });
    await tx.wait();
    loadMarketItems();
    setIsLoading(false);
  }

  /**
   * 
   * Minta un lote de NFTs y los lista en el marketplace.
   * Se le pasa la URI del NFT y el precio.
   */
  async function mintInitialBatch() {
    if (!contract) return;
    setIsLoading(true);
    // Minta 10 NFTs de prueba 
    for (let i = 1; i <= 10; i++) {
      const uri = `ipfs://bafybeigmal6ly6u6xq7r5fkt5bgqd4cb3kyc663ubq2kgvgv7wlmp34imq/nft${i}.json`;
      const price = ethers.parseEther("5");
      await (await contract.mintAndList(uri, price)).wait();
    }
    loadMarketItems();
    setIsLoading(false);
  }

  /**
   * Retira los fondos acumulados en el contrato.
   */
  async function withdrawFunds() {
    if (!contract) return;
    try {
      setIsLoading(true);
      const tx = await contract.withdraw();
      await tx.wait();
      checkWithdrawableFunds(); // Actualiza el balance
    } catch (error) {
      console.error("Error al retirar fondos:", error);
      alert("No se pudo retirar. Asegúrate de tener fondos acumulados.");
    } finally {
      setIsLoading(false);
    }
  } 

  /**
   * Consultar fondos disponibles para retirar
  */
  async function checkWithdrawableFunds() {
    if (!contract || !currentAccount) return;
    try {
      const proceeds = await contract.pendingWithdrawals(currentAccount);
      setWithdrawableBalance(ethers.formatEther(proceeds));
    } catch (error) {
      console.error("Error consultando proceeds:", error);
      setWithdrawableBalance("0");
    }
  }

  // Convertir IPFS a HTTP
  function ipfsToHttp(url) {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return url;
  }

  //  Hook para cargar datos iniciales al conectar contrato/cuenta
  useEffect(() => {
    if (contract) {
      loadMarketItems();
      checkWithdrawableFunds();
    }
  }, [contract, currentAccount]);

return (
  <>
    {isLoading && (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    )}

    <Marketplace
      currentAccount={currentAccount}
      connectWallet={connectWallet}
      mintInitialBatch={mintInitialBatch}
      marketItems={marketItems}
      purchase={purchase}
      withdrawFunds={withdrawFunds}
      withdrawableBalance={withdrawableBalance}
    />
  </>
);
}

export default App;
