
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './contracts/MarketplaceABI.json';
import './App.css';
import nftImage from './images/nft.jpg';

import addressJSON from '../../scripts/contract-address.json';
const contractAddress = addressJSON.contractAddress;

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [myNfts, setMyNfts] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask no está instalada");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setCurrentAccount(account);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(contractAddress, abi, signer);
      setContract(nftContract);

      await loadMarketItems(nftContract, account);
    } catch (error) {
      console.error("❌ Error al conectar con MetaMask o al instanciar el contrato:");
      console.error("Mensaje:", error.message);
      if (error.data && error.data.message) {
        console.error("Detalle:", error.data.message);
      }
    }
  }

  async function loadMarketItems(marketplace) {
    const items = [];
    const maxSupply = 20;

    for (let tokenId = 1; tokenId <= maxSupply; tokenId++) {
      try {
        const owner = await marketplace.ownerOf(tokenId);
        const [seller, price, isSold] = await marketplace.getListing(tokenId);

        if (!isSold) {
          const uri = await marketplace.tokenURI(tokenId);
          items.push({
            tokenId,
            price: ethers.formatEther(price),
            uri,
          });
        }
      } catch (err) {
        if (err.message.includes("invalid token ID") || err.message.includes("nonexistent token")) {
          continue;
        } else {
          console.error(`❌ Error inesperado con token ${tokenId}:`, err);
        }
      }
    }

    setNfts(items);
  }

  async function mintInitialBatch() {
    if (!contract) {
      alert("Conectá primero con MetaMask");
      return;
    }

    try {
      for (let i = 1; i <= 10; i++) {
        const uri = `https://via.placeholder.com/150?text=NFT+${i}`;
        const priceInEth = "0.01";
        const tx = await contract.mintAndList(uri, ethers.parseUnits(priceInEth, "ether"));
        await tx.wait();
      }

      alert("NFTs minteados con éxito");
      loadMarketItems(contract);
    } catch (error) {
      console.error("❌ Error al mintear:", error);
      alert("Falló el minteo");
    }
  }

  async function purchase(tokenId, price) {
    if (!contract) return;

    try {
      const tx = await contract.buy(tokenId, {
        value: ethers.parseEther(price)
      });
      await tx.wait();
      alert(`NFT ${tokenId} comprado con éxito`);
      loadMarketItems(contract);
    } catch (error) {
      console.error("Error al comprar:", error);
      alert("Error al comprar NFT");
    }
  }

  async function withdrawFunds() {
    if (!contract) return;

    try {
      const tx = await contract.withdraw();
      await tx.wait();
      alert("Fondos retirados correctamente");
    } catch (error) {
      console.error("Error al retirar fondos:", error);
      alert("No hay fondos para retirar o no sos el vendedor");
    }
  }

  async function loadMyNfts() {
    if (!contract || !currentAccount) return;

    const ownedItems = [];
    const maxSupply = 20;

    for (let tokenId = 1; tokenId <= maxSupply; tokenId++) {
      try {
        const owner = await contract.ownerOf(tokenId);
        const [seller, price, isSold] = await contract.getListing(tokenId);

        if (owner.toLowerCase() === currentAccount.toLowerCase() && isSold) {
          const uri = await contract.tokenURI(tokenId);
          ownedItems.push({
            tokenId,
            uri,
          });
        }
      } catch (err) {
        continue;
      }
    }

    setMyNfts(ownedItems);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>NFT Marketplace</h1>

      {currentAccount ? (
        <>
          <p>Cuenta conectada: {currentAccount}</p>
          <button onClick={withdrawFunds}>Retirar ganancias</button>
          <button onClick={mintInitialBatch}>Mintear NFTs de prueba</button>
          <button onClick={loadMyNfts}>Ver mis NFTs</button>
        </>
      ) : (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      )}

      <div style={{ marginTop: 20 }}>
        {nfts.length === 0 ? (
          <p>No hay NFTs listados.</p>
        ) : (
          nfts.map((nft) => (
            <div key={nft.tokenId} style={{ border: '1px solid gray', marginBottom: 15, padding: 10 }}>
              <img src={nftImage} alt={`NFT ${nft.tokenId}`} style={{ width: '150px' }} />
              <p>ID: {nft.tokenId}</p>
              <p>Precio: {nft.price} ETH</p>
              <button onClick={() => purchase(nft.tokenId, nft.price)}>Comprar</button>
            </div>
          ))
        )}
      </div>

      {myNfts.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2>Mis NFTs Comprados</h2>
          {myNfts.map(nft => (
            <div key={nft.tokenId} style={{ border: '1px solid green', padding: 10, marginBottom: 10 }}>
              <img src={nftImage} alt={`NFT ${nft.tokenId}`} style={{ width: '150px' }} />
              <p>ID: {nft.tokenId}</p>
              <p>URI: {nft.uri}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
