import React from 'react';
import useBlockchain from '../hooks/useBlockchain';

const AccountInfo = () => {
  const { account, getTestTokens, loading } = useBlockchain();
  if (!account) return null;

  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <h3>Connected Account</h3>
      <p style={{ fontFamily: 'monospace' }}>{account}</p>
      <button onClick={getTestTokens} disabled={loading}>
        {loading ? 'Minting...' : 'Get Test Tokens'}
      </button>
    </div>
  );
};

export default AccountInfo;