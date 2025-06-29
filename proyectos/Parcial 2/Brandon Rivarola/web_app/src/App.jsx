import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// Dirección y ABI del contrato Marketplace
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ABI = [
  "function numeroToken() view returns (uint256)",
  "function mintAndList(string _uri, uint96 _precio) external",
  "function buy(uint256 _IDtoken) external payable",
  "function getListing(uint256 _IDtoken) external view returns(address,uint96,bool)",
  "event ItemListed(uint256 indexed IDtoken,address indexed poseedor,uint96 precio)",
  "event ItemSold(uint256 indexed IDtoken,address indexed comprador,uint96 precio)"
];

const NFTS_INICIALES = [
  { uri: "https://placekitten.com/300/300?image=1", precio: ethers.parseEther("0.01") },
  { uri: "https://placekitten.com/300/300?image=2", precio: ethers.parseEther("0.02") },
  { uri: "https://placekitten.com/300/300?image=3", precio: ethers.parseEther("0.03") },
  { uri: "https://placekitten.com/300/300?image=4", precio: ethers.parseEther("0.04") },
  { uri: "https://placekitten.com/300/300?image=5", precio: ethers.parseEther("0.05") },
  { uri: "https://placekitten.com/300/300?image=6", precio: ethers.parseEther("0.06") },
  { uri: "https://placekitten.com/300/300?image=7", precio: ethers.parseEther("0.07") },
  { uri: "https://placekitten.com/300/300?image=8", precio: ethers.parseEther("0.08") },
  { uri: "https://placekitten.com/300/300?image=9", precio: ethers.parseEther("0.09") },
  { uri: "https://placekitten.com/300/300?image=10", precio: ethers.parseEther("0.1") }
];

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [marketItems, setMarketItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Conecta la wallet de MetaMask
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Instala MetaMask para continuar");
      return;
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setCurrentAccount(accounts[0]);
  }

  // Instancia ethers.js del contrato
  function getContract(signerOrProvider) {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
  }

  // Mintea un batch inicial de NFTs si aún no existen
  async function mintInitialBatch() {
    if (!window.ethereum) return;
    setLoading(true);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractRead = getContract(provider);
    const contractWrite = getContract(signer);

    // Verifica cuántos NFTs existen ya
    const total = await contractRead.numeroToken();
    if (Number(total) >= NFTS_INICIALES.length) {
      setLoading(false);
      return;
    }

    // Mintea los que faltan
    for (let i = Number(total); i < NFTS_INICIALES.length; i++) {
      const { uri, precio } = NFTS_INICIALES[i];
      try {
        const tx = await contractWrite.mintAndList(uri, precio);
        await tx.wait();
      } catch (e) {
        // Puede fallar si no eres el owner, ignora
      }
    }
    setLoading(false);
    await loadMarketItems();
  }

  // Carga todos los NFTs listados
  async function loadMarketItems() {
    if (!window.ethereum) return;
    setLoading(true);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);

    const total = await contract.numeroToken();
    const items = [];
    for (let i = 1; i <= total; i++) {
      const [poseedor, precio, estaVendido] = await contract.getListing(i);
      // Si el NFT existe y no está vendido, lo mostramos
      if (poseedor !== ethers.AddressZero) {
        // Obtener metadata (solo imagen y nombre desde el URI)
        let meta = {};
        try {
          const res = await fetch(await contract.tokenURI(i));
          meta = await res.json();
        } catch {
          meta = { image: NFTS_INICIALES[i - 1]?.uri, name: `NFT #${i}` };
        }
        items.push({
          tokenId: i,
          poseedor,
          precio,
          estaVendido,
          image: meta.image || NFTS_INICIALES[i - 1]?.uri,
          name: meta.name || `NFT #${i}`
        });
      }
    }
    setMarketItems(items);
    setLoading(false);
  }

  // Compra un NFT
  async function purchase(tokenId, precio) {
    if (!window.ethereum) return;
    setLoading(true);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    try {
      // setApprovalForAll para que MetaMask lo muestre como propio
      await contract.setApprovalForAll(CONTRACT_ADDRESS, true);
    } catch {}
    try {
      const tx = await contract.buy(tokenId, { value: precio });
      await tx.wait();
      await loadMarketItems();
    } catch (e) {
      alert("Error al comprar: " + (e?.reason || e?.message));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setCurrentAccount(accounts[0]);
      });
    }
    // Carga inicial
    connectWallet();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      mintInitialBatch();
      loadMarketItems();
    }
  }, [currentAccount]);

  return (
    <div style={{ padding: 32 }}>
      <h1>Marketplace NFT</h1>
      {!currentAccount && (
        <button onClick={connectWallet}>Conectar Wallet</button>
      )}
      {currentAccount && (
        <div>
          <p>Cuenta conectada: {currentAccount}</p>
        </div>
      )}
      <h2>Galería</h2>
      {loading && <p>Cargando...</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {marketItems.map((item) => (
          <div key={item.tokenId} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, width: 220 }}>
            <img src={item.image} alt={item.name} style={{ width: "100%", borderRadius: 8 }} />
            <h3>{item.name}</h3>
            <p>Precio: {ethers.formatEther(item.precio)} ETH</p>
            <p>Vendedor: {item.poseedor.slice(0, 6)}...{item.poseedor.slice(-4)}</p>
            {!item.estaVendido ? (
              <button onClick={() => purchase(item.tokenId, item.precio)} disabled={loading}>
                Comprar
              </button>
            ) : (
              <span style={{ color: "green" }}>Vendido</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;