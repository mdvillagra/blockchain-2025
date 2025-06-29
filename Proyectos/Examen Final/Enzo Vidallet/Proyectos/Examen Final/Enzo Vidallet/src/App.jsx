// File: src/App.jsx
import React from 'react';
import Header from './components/Header';
import WalletConnector from './components/WalletConnector';
import AccountInfo from './components/AccountInfo';
import BalanceOverview from './components/BalanceOverview';
import PositionOverview from './components/PositionOverview';
import Deposit from './components/ActionPanels/Deposit';
import Borrow from './components/ActionPanels/Borrow';
import Repay from './components/ActionPanels/Repay';
import Withdraw from './components/ActionPanels/Withdraw';
import ProtocolInfo from './components/ProtocolInfo';

const App = () => {
  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      color: 'white',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)' 
      }}>
        <Header />
        <WalletConnector />
        <AccountInfo />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <BalanceOverview />
          <PositionOverview />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <Deposit />
          <Borrow />
          <Repay />
          <Withdraw />
        </div>

        <ProtocolInfo />
      </div>
    </div>
  );
};

export default App;
