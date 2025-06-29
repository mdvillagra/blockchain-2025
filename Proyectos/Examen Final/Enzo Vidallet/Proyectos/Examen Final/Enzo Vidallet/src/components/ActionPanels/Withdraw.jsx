import React from 'react';
import useBlockchain from '../../hooks/useBlockchain';

const Withdraw = () => {
  const { withdraw, loading, userPosition } = useBlockchain();

  return (
    <div>
      <h4>Withdraw Collateral</h4>
      <button onClick={withdraw} disabled={loading || parseFloat(userPosition.debt) > 0 || parseFloat(userPosition.collateral) === 0}>
        {loading ? 'Processing...' : 'Withdraw'}
      </button>
    </div>
  );
};

export default Withdraw;