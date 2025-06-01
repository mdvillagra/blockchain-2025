import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";

// Imagenes importadas
import nft0 from "./assets/nft-0.jpg";
import nft1 from "./assets/nft-1.jpg";
import nft2 from "./assets/nft-2.jpg";
import nft3 from "./assets/nft-3.jpg";
import nft4 from "./assets/nft-4.jpg";
import nft5 from "./assets/nft-5.jpg";
import nft6 from "./assets/nft-6.jpg";
import nft7 from "./assets/nft-7.jpg";
import nft8 from "./assets/nft-8.jpg";
import nft9 from "./assets/nft-9.jpg";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const localImages = {
  0: nft0,
  1: nft1,
  2: nft2,
  3: nft3,
  4: nft4,
  5: nft5,
  6: nft6,
  7: nft7,
  8: nft8,
  9: nft9,
};
function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState({ general: false, purchasing: false });
  const [error, setError] = useState("");
  const [updateFlag, setUpdateFlag] = useState(false);

  /**
   * Carga los NFTs listados en el contrato.
   * Optimizado con useCallback para evitar recreaciones innecesarias.
   */
  const loadNFTs = useCallback(async () => {
    if (!contract) return;

    setLoading((prev) => ({ ...prev, general: true }));
    setError("");

    try {
      const items = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          try {
            const [owner, price, sold] = await contract.getListing(i);
            return {
              tokenId: i,
              owner,
              price: ethers.formatEther(price),
              uri: localImages[i],
              sold,
            };
          } catch (error) {
            console.error(`Error con NFT ${i}:`, error);
            return null;
          }
        })
      );

      setNfts(items.filter((item) => item !== null));
    } catch (err) {
      setError("Error al cargar NFTs");
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, general: false }));
    }
  }, [contract]);

  /**
   * Conecta la wallet MetaMask del usuario y configura el contrato.
   * También configura listeners para eventos del contrato.
   */
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("Instala MetaMask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      const signer = await provider.getSigner();
      const marketContract = new ethers.Contract(contractAddress, abi, signer);
      setContract(marketContract);

      marketContract.on("ItemSold", (tokenId) => {
        console.log(`NFT ${tokenId} vendido, actualizando...`);
        setUpdateFlag((prev) => !prev);
      });
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Compra un NFT específico.
   * Maneja estados de carga, actualización y errores.
   * tokenId - ID del NFT a comprar
   * price - Precio en ETH (como string)
   */
  const purchase = async (tokenId, price) => {
    if (!account) return setError("Conecta tu wallet");

    setLoading((prev) => ({ ...prev, purchasing: true }));
    setError("");

    try {
      const tx = await contract.buy(tokenId, {
        value: ethers.parseEther(price),
      });

      setNfts((prev) =>
        prev.map((nft) =>
          nft.tokenId === tokenId ? { ...nft, sold: true } : nft
        )
      );

      await tx.wait();

      loadNFTs();
    } catch (err) {
      // Revertir actualización optimista si hay error
      setNfts((prev) =>
        prev.map((nft) =>
          nft.tokenId === tokenId ? { ...nft, sold: false } : nft
        )
      );

      setError(
        err.message.includes("user rejected")
          ? "Transacción cancelada"
          : "Error comprando NFT"
      );
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, purchasing: false }));
    }
  };

  useEffect(() => {
    if (contract) {
      loadNFTs();
    }

    return () => {
      if (contract) {
        contract.removeAllListeners("ItemSold");
      }
    };
  }, [contract, loadNFTs, updateFlag]);

  return (
    <div className="app-container">
      <h1>🛒 NFT Marketplace</h1>

      {!account ? (
        <button onClick={connectWallet} className="connect-button">
          Conectar MetaMask
        </button>
      ) : (
        <p>Conectado: {`${account.slice(0, 6)}...${account.slice(-4)}`}</p>
      )}

      {error && <p className="error-message">{error}</p>}

      <div className="nft-grid">
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className={`nft-card ${nft.sold ? "sold" : ""}`}
          >
            <img
              src={nft.uri}
              alt={`NFT ${nft.tokenId}`}
              className="nft-image"
            />
            <div className="nft-info">
              <p className="nft-id">NFT #{nft.tokenId}</p>
              <p className="nft-price">{nft.price} ETH</p>
              <button
                onClick={() => purchase(nft.tokenId, nft.price)}
                disabled={loading.purchasing || nft.sold}
                className={`buy-button ${nft.sold ? "sold" : ""}`}
              >
                {nft.sold
                  ? "Vendido"
                  : loading.purchasing
                  ? "Procesando..."
                  : "Comprar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
