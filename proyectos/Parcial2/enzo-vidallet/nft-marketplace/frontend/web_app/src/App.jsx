import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from './contracts/config';
import './App.css';

const HARDHAT_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    name: "Account 1"
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    name: "Account 2"
  }
];

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          // Configurar provider
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          // Solicitar conexión de cuentas
          await web3Provider.send("eth_requestAccounts", []);
          
          // Usar primera cuenta de prueba por defecto
          await changeAccount(HARDHAT_ACCOUNTS[0].address, web3Provider);
        } else {
          alert("Please install MetaMask!");
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const changeAccount = async (address, providerInstance = provider) => {
    try {
      const selectedAccount = HARDHAT_ACCOUNTS.find(a => a.address === address);
      if (!selectedAccount || !providerInstance) return;
      
      setAccount(selectedAccount.address);
      
      // Actualizar balance
      const accBalance = await providerInstance.getBalance(selectedAccount.address);
      setBalance(ethers.utils.formatEther(accBalance));
      
      // Crear wallet con la private key
      const wallet = new ethers.Wallet(selectedAccount.privateKey, providerInstance);
      
      // Inicializar contrato
      const marketplaceContract = new ethers.Contract(
        contractAddress,
        contractABI,
        wallet
      );
      setContract(marketplaceContract);
      await loadMarketItems(marketplaceContract);
    } catch (error) {
      console.error("Error changing account:", error);
    }
  };

  const loadMarketItems = async (contractInstance) => {
    try {
      if (!contractInstance) throw new Error("Contract not initialized");
      
      const itemCount = await contractInstance.getCurrentTokenId();
      const items = [];
      
      for (let i = 1; i <= itemCount.toNumber(); i++) {
        const [owner, price, sold] = await contractInstance.getListing(i);
        if (!sold) {
          items.push({
            tokenId: i,
            owner,
            price: ethers.utils.formatEther(price),
            sold,
            image: `https://example.com/nft/${i}.png`
          });
        }
      }
      
      setNfts(items);
    } catch (error) {
      console.error("Error loading market items:", error);
    }
  };

  const mintInitialBatch = async () => {
    try {
      if (!contract || !provider) return;
      
      const currentBalance = await provider.getBalance(account);
      const required = ethers.utils.parseEther("0.25"); // 0.025 x 10
      
      if (currentBalance.lt(required)) {
        alert(`Necesitas al menos 0.25 ETH (tienes ${ethers.utils.formatEther(currentBalance)})`);
        return;
      }

      const sampleURIs = Array(10).fill().map((_, i) => `ipfs://QmSample${i+1}`);
      const samplePrices = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1];

      const tx = await contract.mintInitialBatch(
        sampleURIs,
        samplePrices.map(p => ethers.utils.parseEther(p.toString())),
        { value: required }
      );
      
      await tx.wait();
      await loadMarketItems(contract);
      
      // Actualizar balance después del mint
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(newBalance));
      
      alert("10 NFTs minteados exitosamente!");
    } catch (error) {
      console.error("Error minting NFTs:", error);
      alert(`Error: ${error.reason || error.message.split("[")[0]}`);
    }
  };

  const purchaseNFT = async (tokenId, price) => {
    try {
      if (!contract) return;
      
      const tx = await contract.buy(tokenId, {
        value: ethers.utils.parseEther(price.toString())
      });
      
      await tx.wait();
      await loadMarketItems(contract);
      
      // Actualizar balance después de la compra
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(newBalance));
      
      alert("NFT purchased successfully!");
    } catch (error) {
      console.error("Purchase error:", error);
      alert(`Error: ${error.reason || "Failed to purchase NFT"}`);
    }
  };

  if (loading) return <div className="loading">Loading blockchain data...</div>;

  return (
    <div className="App">
      <header>
        <h1>NFT Marketplace</h1>
        <div className="account-selector">
          <select 
            onChange={(e) => changeAccount(e.target.value)}
            value={account}
            disabled={!provider}
          >
            {HARDHAT_ACCOUNTS.map(acc => (
              <option key={acc.address} value={acc.address}>
                {acc.name} ({acc.address.substring(0, 6)}...)
              </option>
            ))}
          </select>
          {account && (
            <p>Balance: {balance} ETH</p>
          )}
        </div>
      </header>

      <main>
        <button 
          onClick={mintInitialBatch} 
          className="mint-button"
          disabled={!contract}
        >
          Mint Initial Batch (10 NFTs)
        </button>
        
        <div className="nft-grid">
          {nfts.length > 0 ? (
            nfts.map(nft => (
              <div key={nft.tokenId} className="nft-card">
                <img 
                  src={nft.image || 'placeholder-nft.png'} 
                  alt={`NFT ${nft.tokenId}`}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'placeholder-nft.png';
                  }}
                />
                <div className="nft-info">
                  <h3>NFT #{nft.tokenId}</h3>
                  <p>Price: {nft.price} ETH</p>
                  <button 
                    onClick={() => purchaseNFT(nft.tokenId, nft.price)}
                    className="buy-button"
                    disabled={!contract}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No NFTs listed yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;