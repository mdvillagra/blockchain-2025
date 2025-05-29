import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './abi.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const rpcUrl = import.meta.env.VITE_RPC_URL;

function App() {
  const [account, setAccount] = useState('');
  const [items, setItems] = useState([]);

  const connectWallet = async () => {
    const [addr] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(addr);
  };

  const loadMarket = async () => {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const temp = [];
    for (let i = 0; i < 10; i++) {
      try {
        const [owner, price, sold] = await contract.getListing(i);
        if (!sold) {
          temp.push({
            tokenId: i,
            price: ethers.utils.formatEther(price),
            owner,
          });
        }
      } catch (err) {
        break;
      }
    }
    setItems(temp);
  };

  const buyNFT = async (tokenId, price) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const tx = await contract.buy(tokenId, {
      value: ethers.utils.parseEther(price),
    });
    await tx.wait();
    loadMarket();
  };

  useEffect(() => {
    loadMarket();
  }, []);

  return (
    <div>
      <h1>NFT Marketplace</h1>
      {!account && <button onClick={connectWallet}>Conectar Wallet</button>}
      {account && <p>Conectado como: {account}</p>}
      <div>
        {items.length === 0 && <p>No hay NFTs listados</p>}
        {items.map(({ tokenId, owner, price }) => (
          <div key={tokenId} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <p>ID: {tokenId}</p>
            <p>Owner: {owner}</p>
            <p>Precio: {price} ETH</p>
            <button onClick={() => buyNFT(tokenId, price)}>Comprar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
