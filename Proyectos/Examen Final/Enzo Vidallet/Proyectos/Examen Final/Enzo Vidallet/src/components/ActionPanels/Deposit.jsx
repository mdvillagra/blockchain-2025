import React, { useState } from 'react';
import useBlockchain from '../../hooks/useBlockchain';

const Deposit = () => {
  const { deposit, loading } = useBlockchain();
  const [amount, setAmount] = useState('');

  return (
    <div>
      <h4>Deposit Collateral</h4>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="cUSD amount" />
      <button onClick={() => deposit(amount)} disabled={loading || !amount}>
        {loading ? 'Processing...' : 'Deposit'}
      </button>
    </div>
  );
};

export default Deposit;