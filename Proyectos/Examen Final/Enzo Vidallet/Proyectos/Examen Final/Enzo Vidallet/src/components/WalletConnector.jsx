import React from 'react';
import useBlockchain from '../hooks/useBlockchain';

const WalletConnector = () => {
  const { account, networkError, connectWallet, switchToSepolia } = useBlockchain();

  if (account) return null;

  return (
    <div style={{ textAlign: 'center' }}>
      {networkError && (
        <div style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.5)', padding: 15, borderRadius: 10, marginBottom: 20, color: '#ff6b6b' }}>
          <p>{networkError}</p>
          <button onClick={switchToSepolia} style={{ marginTop: 10 }}>Switch to Sepolia</button>
        </div>
      )}
      <button onClick={connectWallet} style={{ padding: '15px 30px', borderRadius: 10, cursor: 'pointer' }}>
        Connect MetaMask
      </button>
    </div>
  );
};

export default WalletConnector;