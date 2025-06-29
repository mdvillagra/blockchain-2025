import React from 'react';
import useBlockchain from '../../hooks/useBlockchain';

const Repay = () => {
  const { repay, loading, userPosition } = useBlockchain();
  const total = (parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toFixed(4);

  return (
    <div>
      <h4>Repay Loan</h4>
      <p>Total: {total} dDAI</p>
      <button onClick={repay} disabled={loading || parseFloat(userPosition.debt) === 0}>
        {loading ? 'Processing...' : 'Repay All'}
      </button>
    </div>
  );
};

export default Repay;