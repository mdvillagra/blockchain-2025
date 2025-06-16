import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './abi.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const rpcUrl = import.meta.env.VITE_RPC_URL;

function App() {
  const [account, setAccount] = useState('');
  const [items, setItems] = useState([]);
  const [mintPrice, setMintPrice] = useState('');
  const [tokenUri, setTokenUri] = useState('');
  const [mintLoading, setMintLoading] = useState(false);
  const [userBalance, setUserBalance] = useState('0');

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
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.buy(tokenId, {
        value: ethers.utils.parseEther(price),
      });
      await tx.wait();
      alert('Compra exitosa!');
      loadMarket();
      getUserBalance();
    } catch (error) {
      console.error('Error al comprar NFT:', error);
      alert('Error al comprar NFT: ' + (error.reason || error.message));
    }
  };

  const getUserBalance = async () => {
    if (!account) return;
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const balance = await contract.balances(account);
      setUserBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error al obtener balance:', error);
    }
  };

  const withdrawBalance = async () => {
    if (!account) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.withdraw();
      await tx.wait();
      alert('Retiro exitoso!');
      setUserBalance('0');
    } catch (error) {
      console.error('Error al retirar:', error);
      alert('Error al retirar: ' + (error.reason || error.message));
    }
  };

  const mintAndListNFT = async () => {
    if (!account) return alert('Conecta tu wallet');
    if (!mintPrice || isNaN(mintPrice) || parseFloat(mintPrice) <= 0) {
      return alert('Precio inválido');
    }
    if (!tokenUri.trim()) return alert('URI inválida');

    try {
      setMintLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const priceInWei = ethers.utils.parseEther(mintPrice);
      const tx = await contract.mintAndList(tokenUri, priceInWei);
      await tx.wait();
      alert('NFT minteado y listado exitosamente!');
      setMintPrice('');
      setTokenUri('');
      loadMarket();
    } catch (error) {
      console.error('Error al mintear NFT:', error);
      alert('Error: ' + (error.reason || error.message));
    } finally {
      setMintLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
  }, []);

  useEffect(() => {
    if (account) getUserBalance();
  }, [account]);

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mercado de NFTs</h1>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 transition"
            >
              Conectar Wallet
            </button>
          ) : (
            <div className="text-gray-800">
              <p className="text-sm">Conectado como:</p>
              <p className="font-medium">{account}</p>
              <p className="mt-2">
                Balance disponible: <strong>{userBalance} ETH</strong>
              </p>
              {parseFloat(userBalance) > 0 && (
                <button
                  onClick={withdrawBalance}
                  className="mt-2 bg-green-700 text-white px-4 py-1 rounded hover:bg-green-800"
                >
                  Retirar Ganancias
                </button>
              )}
            </div>
          )}
        </header>
  
        {account && (
          <section className="bg-white shadow-md rounded-lg p-6 mb-10 border border-gray-300">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Crear y Listar un Nuevo NFT</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700">Token URI:</label>
                <input
                  type="text"
                  value={tokenUri}
                  onChange={(e) => setTokenUri(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-400 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://ipfs.io/ipfs/..."
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700">Precio (ETH):</label>
                <input
                  type="number"
                  step="0.001"
                  value={mintPrice}
                  onChange={(e) => setMintPrice(e.target.value)}
                  className="w-40 px-4 py-2 border border-gray-400 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.1"
                />
              </div>
              <button
                onClick={mintAndListNFT}
                disabled={mintLoading}
                className={`px-6 py-2 rounded text-white font-medium ${
                  mintLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-700 hover:bg-blue-800'
                } transition`}
              >
                {mintLoading ? 'Minteando...' : 'Mintear y Listar NFT'}
              </button>
            </div>
          </section>
        )}
  
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">NFTs Disponibles para Comprar</h2>
          {items.length === 0 ? (
            <p className="text-gray-500">Actualmente no hay NFTs listados en el mercado.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {items.map(({ tokenId, owner, price }) => (
                <div key={tokenId} className="bg-white shadow-md rounded-md p-4 border border-gray-300 text-gray-800">
                  <p className="text-sm text-gray-600">ID del NFT: {tokenId}</p>
                  <p className="text-sm truncate">Propietario: {owner}</p>
                  <p className="mt-1 font-bold text-green-700">{price} ETH</p>
                  <button
                    onClick={() => buyNFT(tokenId, price)}
                    className="mt-3 bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition"
                  >
                    Comprar NFT
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
