import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import UserPosition from './UserPosition.jsx';
import CollateralManager from './CollateralManager.jsx';
import BorrowManager from './BorrowManager.jsx';
import RepayManager from './RepayManager.jsx';
import WithdrawManager from './WithdrawManager.jsx';
import './App.css';

export default function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        
        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        setNetworkName(network.name === 'unknown' ? 'Local' : network.name);
        
        console.log('Connected to:', network.name, 'Chain ID:', network.chainId);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error conectando wallet: ' + error.message);
      }
    } else {
      alert('¡Por favor instala MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setNetworkName('');
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            setAccount(accounts[0].address);
            setProvider(provider);
            setSigner(signer);
            setIsConnected(true);
            setNetworkName(network.name === 'unknown' ? 'Local' : network.name);
          }
        } catch (error) {
          console.log('No wallet connected');
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏦 Protocolo de Préstamos DeFi</h1>
          <p className="subtitle">Deposita cUSD • Pide prestado dDAI • Interés semanal del 5%</p>
        </div>
        <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-info">
              <div className="network-badge">
                🌐 {networkName}
              </div>
              <span className="account">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <button onClick={disconnectWallet} className="disconnect-btn">
                Desconectar
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-btn">
              Conectar Wallet
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {isConnected ? (
          <>
            <div className="protocol-info">
              <div className="info-card">
                <h3>📊 Información del Protocolo</h3>
                <div className="protocol-stats">
                  <div className="stat">
                    <span className="label">Ratio de Colateralización:</span>
                    <span className="value">150%</span>
                  </div>
                  <div className="stat">
                    <span className="label">Interés Semanal:</span>
                    <span className="value">5% fijo</span>
                  </div>
                  <div className="stat">
                    <span className="label">Token Colateral:</span>
                    <span className="value">cUSD</span>
                  </div>
                  <div className="stat">
                    <span className="label">Token Préstamo:</span>
                    <span className="value">dDAI</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard">
              <UserPosition account={account} provider={provider} />
            </div>
            
            <div className="actions-grid">
              <CollateralManager signer={signer} account={account} />
              <BorrowManager signer={signer} account={account} />
              <RepayManager signer={signer} account={account} />
              <WithdrawManager signer={signer} account={account} />
            </div>
          </>
        ) : (
          <div className="welcome">
            <div className="welcome-content">
              <h2>🎯 Bienvenido al Protocolo de Préstamos</h2>
              <p>Un protocolo DeFi simple sin intermediarios para préstamos colateralizados</p>
              
              <div className="features">
                <div className="feature">
                  <span className="icon">💎</span>
                  <div>
                    <h4>Deposita Colateral</h4>
                    <p>Usa cUSD como garantía para tus préstamos</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon">💰</span>
                  <div>
                    <h4>Pide Prestado dDAI</h4>
                    <p>Hasta el 66.67% de tu colateral (ratio 150%)</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon">📈</span>
                  <div>
                    <h4>Interés Fijo del 5%</h4>
                    <p>Por semana, sin cálculo compuesto</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon">🔒</span>
                  <div>
                    <h4>Sin Oráculos</h4>
                    <p>Sistema simple sin dependencias externas</p>
                  </div>
                </div>
              </div>

              <div className="example">
                <h3>📋 Ejemplo Práctico</h3>
                <div className="example-steps">
                  <div className="step">1. Depositas 150 cUSD</div>
                  <div className="arrow">→</div>
                  <div className="step">2. Puedes pedir hasta 100 dDAI</div>
                  <div className="arrow">→</div>
                  <div className="step">3. Pagas 105 dDAI para repagar</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>🚀 Protocolo de Préstamos DeFi - Blockchain Aplicada</p>
      </footer>
    </div>
  );
}


