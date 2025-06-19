import React from 'react';

const Header = () => (
  <header style={{ textAlign: 'center', marginBottom: '40px' }}>
    <h1 style={{
      fontSize: '3rem',
      margin: '0 0 10px',
      background: 'linear-gradient(45deg, #fff, #f0f8ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }}>
      DeFi Lending Protocol
    </h1>
    <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
      Deposit cUSD collateral, borrow dDAI with 150% collateralization
    </p>
  </header>
);

export default Header;