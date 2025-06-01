import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './abi/Marketplace.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const IPFS_GATEWAY = "https://white-dear-jaguar-287.mypinata.cloud/ipfs/";
const RPC_URL = import.meta.env.VITE_RPC_URL;

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [pendingBalance, setPendingBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [buyingId, setBuyingId] = useState(null); // TokenId que está siendo comprado
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Cargar contrato al inicio
  useEffect(() => {
    loadContract();
  }, []);

  // Cargar NFTs cuando cambia la pestaña a home
  useEffect(() => {
    if (contract && activeTab === 'home') {
      loadMarketItems();
    }
  }, [activeTab]);

  // Cargar NFTs cuando cambia el contrato
  useEffect(() => {
    if (contract) {
      loadMarketItems();
    }
  }, [contract]);

  // Actualizar balance cuando cambia la cuenta
  useEffect(() => {
    if (contract && account) {
      checkMyBalance();
    }
  }, [account]);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });

        const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(selectedAccount);
        await loadContract();
      } catch (err) {
        console.error("Conexión rechazada o error:", err);
      }
    } else {
      alert("MetaMask no está disponible");
    }
  }

  async function disconnectWallet() {
    setAccount('');
    setPendingBalance('0');
  }

  async function loadContract() {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const instance = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);
        setContract(instance);
      } else {
        // Usar modo lectura si no hay MetaMask
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const instance = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);
        setContract(instance);
      }
    } catch (err) {
      console.error("Error al cargar el contrato:", err);
    }
  }

  async function loadMarketItems() {
    try {
      setIsLoading(true);
      const totalBN = await contract.getTotalListings();
      const totalListings = totalBN.toNumber ? totalBN.toNumber() : totalBN;

      const promises = [];
      for (let i = 0; i < totalListings; i++) {
        promises.push(loadSingleItem(i));
      }

      const itemsList = (await Promise.all(promises)).filter(Boolean);
      setItems(itemsList);
    } catch (err) {
      console.error("Error al cargar ítems del mercado:", err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSingleItem(id) {
    try {
      const [seller, price, isSold, uri] = await contract.getListing(id);
      const metadata = await fetchMetadata(uri);
      if (!metadata) return null;
      const imageUrl = metadata.image?.replace("ipfs://", IPFS_GATEWAY);
      return { id, seller, price, isSold, uri: imageUrl, metadata };
    } catch (err) {
      console.warn(`No se pudo cargar NFT #${id}:`, err.message);
      return null;
    }
  }

  async function fetchMetadata(uri) {
    try {
      const cached = localStorage.getItem(uri);
      if (cached) return JSON.parse(cached);

      const res = await fetch(uri);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const metadata = await res.json();
      localStorage.setItem(uri, JSON.stringify(metadata));
      return metadata;
    } catch (err) {
      console.error("Error al obtener metadata:", err.message);
      return null;
    }
  }

  async function purchase(id) {
    if (!account) {
      alert("Debes conectar tu wallet para comprar.");
      await connectWallet();
      return;
    }

    try {
      setBuyingId(id);

      const listing = await contract.listings(id);
      const price = listing.price;

      const tx = await contract.buy(id, { value: price });
      await tx.wait();

      await loadMarketItems();
    } catch (err) {
      console.error("Error en la compra:", err);
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setBuyingId(null);
    }
  }

  async function withdrawFunds() {
    if (!account) {
      alert("Debes conectar tu wallet para retirar fondos.");
      await connectWallet();
      return;
    }

    try {
      setIsWithdrawing(true);
      const tx = await contract.withdraw();
      await tx.wait();
      alert("Fondos retirados exitosamente");
      await checkMyBalance();
    } catch (err) {
      console.error("Error al retirar:", err);
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  }

  async function checkMyBalance() {
    if (!contract || !account) return;
    try {
      const balance = await contract.pendingWithdrawals(account);
      setPendingBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Error al verificar balance:", err);
    }
  }

  async function mintInitialBatch() {
    if (!account) {
      alert("Debes conectar tu wallet para mintear NFTs.");
      await connectWallet();
      return;
    }

    const uris = [
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/1.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/2.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/3.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/4.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/5.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/6.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/7.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/8.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/9.json",
      "https://white-dear-jaguar-287.mypinata.cloud/ipfs/bafybeia53g2uuaal2sqoigaep4jndus4slm5rze24544mrp2ejtytnq3ha/10.json"
    ];

    const prices = Array(10).fill(ethers.parseUnits("0.01", "ether"));

    try {
      setIsMinting(true);
      const tx = await contract.mintAndList(uris, prices);
      await tx.wait();
      setTimeout(() => {
        setActiveTab('home');
        loadMarketItems(); // Recargar NFTs al volver
      }, 1000);
    } catch (err) {
      console.warn("Error al mintear:", err.message);
      alert(`Error al mintear: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1>NFT MARKETPLACE</h1>
          <div className="account-info">
            {account ? (
              <span className="connected-account">
                Conectado: {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            ) : (
              <button className="connect-button" onClick={connectWallet}>
                🔌 Conectar MetaMask
              </button>
            )}
          </div>
        </div>
        <nav className="main-nav">
          <button
            className={`nav-button ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 Inicio
          </button>
          <button
            className={`nav-button ${activeTab === 'mint' ? 'active' : ''}`}
            onClick={() => setActiveTab('mint')}
          >
            🎨 Mintear
          </button>
          <button
            className={`nav-button ${activeTab === 'funds' ? 'active' : ''}`}
            onClick={() => setActiveTab('funds')}
          >
            💰 Mis Fondos
          </button>
          {account && (
            <button className="nav-button disconnect" onClick={disconnectWallet}>
              🚪 Cerrar Sesión
            </button>
          )}
        </nav>
      </header>

      <main className="main-content">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
          </div>
        )}

        {activeTab === 'home' && (
          <>
            <div className="marketplace-header">
              <h2>NFTs Disponibles</h2>
              <button
                className="refresh-button"
                onClick={loadMarketItems}
                disabled={isLoading}
              >
                🔄 Actualizar
              </button>
            </div>
            {items.length === 0 && !isLoading ? (
              <div className="empty-state">
                <h2>No hay NFTs listados</h2>
                <p>🎨 ¡Mintea los NFTs para empezar!</p>
                <button
                  className="mint-button"
                  onClick={() => setActiveTab('mint')}
                >
                  Ir a Mintear
                </button>
              </div>
            ) : (
              <div className="nft-grid">
                {items.map(({ id, uri, price, isSold, metadata }) => (
                  <div key={id} className="nft-card">
                    <img src={uri} alt={metadata?.name || `NFT ${id}`} />
                    <div className="nft-info">
                      <h3>{metadata?.name || `NFT #${id}`}</h3>
                      <p className="nft-description">{metadata?.description}</p>
                      <p className="nft-price">Precio: {ethers.formatEther(price)} ETH</p>
                      <button
                        className={`buy-button ${isSold ? 'sold' : ''}`}
                        onClick={() => purchase(id)}
                        disabled={isSold || buyingId === id}
                      >
                        {isSold
                          ? 'Vendido'
                          : buyingId === id
                            ? 'Procesando...'
                            : 'Comprar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'mint' && (
          <div className="mint-section">
            <h2>Mintear NFTs</h2>
            <button
              className="mint-button"
              onClick={mintInitialBatch}
              disabled={isMinting}
            >
              {isMinting ? '🎨 Minteando...' : '🎨 Mintear Lote NFT'}
            </button>
          </div>
        )}

        {activeTab === 'funds' && (
          <div className="funds-section">
            <h2>Mis Fondos</h2>
            <div className="balance-info">
              <p>Saldo pendiente: {pendingBalance} ETH</p>
              <button
                className="withdraw-button"
                onClick={withdrawFunds}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? '💸 Procesando...' : '💸 Retirar Fondos'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;