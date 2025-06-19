import React from 'react';
import useBlockchain from '../hooks/useBlockchain';

const PositionOverview = () => {
  const { userPosition, getMaxBorrowable } = useBlockchain();

  return (
    <div>
      <h3>Your Position</h3>
      <p>Collateral: {parseFloat(userPosition.collateral).toFixed(4)} cUSD</p>
      <p>Debt: {parseFloat(userPosition.debt).toFixed(4)} dDAI</p>
      <p>Interest: {parseFloat(userPosition.interest).toFixed(4)} dDAI</p>
      <p>Max Borrow: {getMaxBorrowable()} dDAI</p>
    </div>
  );
};

export default PositionOverview;