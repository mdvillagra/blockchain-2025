import { useState, useEffect } from 'react';
import { connectWallet, formatPrice, parsePrice } from '../utils/ethers';
import { loadContract, MARKETPLACE_ABI } from '../utils/contract';
import '../styles/App.css';
import Navbar from '../components/Navbar';
import NFTGallery from '../components/NFTGallery';
import WalletConnect from '../components/WalletConnect';

function App() {
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);

  const loadMarketItems = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const total = await contract.totalSupply();
      const items = [];
      
      for (let i = 1; i <= total; i++) {
        const [owner, price, isSold, tokenURI] = await contract.getListing(i);
        if (!isSold) {
          items.push({
            id: i,
            owner,
            price: formatPrice(price),
            tokenURI
          });
        }
      }
      
      setNfts(items);
    } catch (error) {
      console.error("Error cargando NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const { account } = await connectWallet();
      setAccount(account);
      
      // Configurar contrato
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        MARKETPLACE_ABI,
        signer
      );
      setContract(contract);
    } catch (error) {
      console.error("Error conectando billetera:", error);
    }
  };

  const purchase = async (tokenId, price) => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      const tx = await contract.buy(tokenId, {
        value: parsePrice(price)
      });
      await tx.wait();
      await loadMarketItems();
      alert("Compra exitosa! El NFT ahora está en tu billetera.");
    } catch (error) {
      console.error("Error comprando NFT:", error);
      alert("Error al comprar el NFT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) {
      loadMarketItems();
    }
  }, [contract]);

  return (
    <div className="App">
      <Navbar />
      <WalletConnect 
        account={account} 
        connectWallet={handleConnectWallet} 
      />
      <NFTGallery 
        nfts={nfts} 
        loading={loading} 
        purchase={purchase} 
        account={account}
      />
    </div>
  );
}

export default App;