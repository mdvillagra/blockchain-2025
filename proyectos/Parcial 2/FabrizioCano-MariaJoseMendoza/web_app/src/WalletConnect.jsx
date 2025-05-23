/* eslint-disable no-unused-vars */
// src/components/WalletConnect.jsx
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const ethProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        setProvider(ethProvider);

        const accounts = await ethProvider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          localStorage.setItem('walletConnected', 'true');
        } else {
          localStorage.removeItem('walletConnected');
        }
      }
    };

    if (localStorage.getItem('walletConnected') === 'true') {
      checkConnection();
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask no está instalada');
      return;
    }

    try {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      const accounts = await ethProvider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      setProvider(ethProvider);
      localStorage.setItem('walletConnected', 'true');
    } catch (error) {
      console.error('Error al conectar', error);
    }
  };

  return (
    <div>
      {account ? (
        <p>Conectado: {account}</p>
      ) : (
        <button onClick={connectWallet}>Conectar Wallet</button>
      )}
    </div>
  );
}
