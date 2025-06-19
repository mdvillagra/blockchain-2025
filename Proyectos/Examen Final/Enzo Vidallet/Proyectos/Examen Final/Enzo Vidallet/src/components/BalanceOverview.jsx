import React from 'react';
import useBlockchain from '../hooks/useBlockchain';

const BalanceOverview = () => {
  const { userBalance } = useBlockchain();

  return (
    <div>
      <h3>Your Balances</h3>
      <p>cUSD: {parseFloat(userBalance.collateral).toFixed(4)}</p>
      <p>dDAI: {parseFloat(userBalance.loan).toFixed(4)}</p>
    </div>
  );
};

export default BalanceOverview;