// web_app/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import './App.css';

// Import contract ABI and address (will be generated after deploy)
import MarketplaceContract from './contracts/Marketplace.json';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [marketItems, setMarketItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    } else {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
  });

  // Check if wallet is connected on load
  useEffect(() => {
    // Check if user explicitly disconnected in this session
    const userDisconnected = sessionStorage.getItem('userDisconnected');

    if (!userDisconnected) {
      checkIfWalletIsConnected();
    } else {
      console.log('Skipping automatic connection because user disconnected.');
    }
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load market items when contract is ready
  useEffect(() => {
    if (contract) {
      loadMarketItems();
    }
  }, [contract]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      }
      
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        setupContract();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      
      // Clear current account state before requesting new connection
      setCurrentAccount('');

      // Clear user disconnected flag
      sessionStorage.removeItem('userDisconnected');

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      setupContract();
    } catch (error) {
      console.log(error);
    }
  };

  const setupContract = async () => {
    try {
      const { ethereum } = window;
      
      if (ethereum) {
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(
          MarketplaceContract.address,
          MarketplaceContract.abi,
          signer
        );
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const loadMarketItems = async () => {
    try {
      setLoading(true);
      const items = [];
      
      console.log("Loading NFTs from contract at:", MarketplaceContract.address);
      
      // Load first 10 NFTs
      for (let i = 1; i <= 10; i++) {
        try {
          const listing = await contract.getListing(i);
          console.log(`Token ${i} listing:`, listing);
          
          // Check if token exists (owner should not be zero address)
          if (listing.owner !== '0x0000000000000000000000000000000000000000') {
            const tokenURI = await contract.tokenURI(i);
            console.log(`Token ${i} tokenURI:`, tokenURI);
            
            let imageUrl = `https://via.placeholder.com/200?text=NFT+${i}`; // Default to placeholder
            let metadata = null;

            try {
              // Fetch metadata from tokenURI
              const response = await fetch(tokenURI);
              console.log(`Token ${i} fetch response status:`, response.status);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              metadata = await response.json();
              console.log(`Token ${i} metadata:`, metadata);

              // Use the image URL from metadata if available
              if (metadata && metadata.image) {
                // Handle IPFS URLs - replace ipfs:// with gateway URL
                if (metadata.image.startsWith('ipfs://')) {
                  const ipfsHash = metadata.image.split('ipfs://')[1];
                  imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
                } else {
                  imageUrl = metadata.image;
                }
              } else {
                console.log(`Metadata for token ${i} does not contain an image field.`);
              }

            } catch (metadataError) {
              console.log(`Error fetching or parsing metadata for token ${i}:`, metadataError);
              // Keep the placeholder image on error
            }

            items.push({
              tokenId: i,
              owner: listing.owner,
              price: formatEther(listing.price),
              isSold: listing.isSold,
              tokenURI: tokenURI,
              image: imageUrl // Use the fetched or placeholder image URL
            });
          }
        } catch (error) {
          console.log(`Error loading token ${i}:`, error);
        }
      }
      
      console.log("Loaded items:", items);
      setMarketItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Error loading market items:", error);
      setLoading(false);
    }
  };

  const purchase = async (tokenId, price) => {
    try {
      if (!contract) return;
      
      setLoading(true);
      
      const priceInWei = parseEther(price);
      const transaction = await contract.buy(tokenId, {
        value: priceInWei
      });
      
      console.log("Processing transaction...", transaction.hash);
      await transaction.wait();
      console.log("Transaction completed!");
      
      // Reload market items to reflect the purchase
      await loadMarketItems();
      
      alert(`NFT #${tokenId} purchased successfully! Check your MetaMask wallet.`);
    } catch (error) {
      console.log("Purchase error:", error);
      alert("Purchase failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const mintInitialBatch = async () => {
    try {
      if (!contract) return;
      
      setLoading(true);
      const transaction = await contract.mintInitialBatch();
      await transaction.wait();
      
      await loadMarketItems();
      alert("Initial batch minted successfully!");
    } catch (error) {
      console.log("Minting error:", error);
      alert("Only owner can mint initial batch.");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    // Set flag in session storage to indicate user disconnected
    sessionStorage.setItem('userDisconnected', 'true');

    setCurrentAccount('');
    setProvider(null);
    setSigner(null);
    setContract(null);
    setMarketItems([]); // Clear market items on disconnect
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>NFT Marketplace</h1>
        
        <button onClick={toggleTheme} className="theme-toggle-btn">
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
        
        {!currentAccount ? (
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p className="wallet-address">Connected: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</p>
            <button onClick={disconnectWallet} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        )}
      </header>

      <main>
        {loading && <div className="loading">Loading...</div>}
        
        {currentAccount && (
          <>
            <div className="controls">
              <button onClick={loadMarketItems} className="refresh-btn">
                Refresh Items
              </button>
            </div>
            
            {marketItems.length === 0 && !loading && (
              <div className="no-items">
                <p>No NFTs found. If you're the contract owner, click "Mint Initial Batch" to create the first 10 NFTs.</p>
              </div>
            )}
            
            <div className="nft-grid">
              {marketItems.map((item) => (
                <div key={item.tokenId} className="nft-card">
                  <img src={item.image} alt={`NFT ${item.tokenId}`} />
                  <h3>NFT #{item.tokenId}</h3>
                  <p className="price">{item.price} ETH</p>
                  
                  {!item.isSold ? (
                    <button 
                      onClick={() => purchase(item.tokenId, item.price)}
                      className="buy-btn"
                      disabled={loading}
                    >
                      Buy
                    </button>
                  ) : (
                    <p className="sold">SOLD</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;