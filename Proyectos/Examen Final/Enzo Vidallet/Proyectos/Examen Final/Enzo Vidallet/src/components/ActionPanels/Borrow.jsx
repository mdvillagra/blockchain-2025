import React, { useState } from 'react';
import useBlockchain from '../../hooks/useBlockchain';

const Borrow = () => {
  const { borrow, loading } = useBlockchain();
  const [amount, setAmount] = useState('');

  return (
    <div>
      <h4>Borrow dDAI</h4>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="dDAI amount" />
      <button onClick={() => borrow(amount)} disabled={loading || !amount}>
        {loading ? 'Processing...' : 'Borrow'}
      </button>
    </div>
  );
};

export default Borrow;
