import React from 'react';

const BalanceSection = ({ sellerBalance, onCheckBalance, onWithdraw }) => {
  const hasFunds = sellerBalance && parseFloat(sellerBalance) > 0;
  const neverChecked = sellerBalance === null;

  return (
    <div style={styles.container}>
      <span style={styles.text}>
        {neverChecked
          ? 'Consulta tu balance'
          : hasFunds
          ? `💸 ${sellerBalance} ETH`
          : 'Sin fondos'}
      </span>

      <button
        onClick={onCheckBalance}
        style={styles.checkButton}
        title="Actualizar Balance"
        onMouseEnter={(e) => (e.target.style.background = styles.checkButtonHover.background)}
        onMouseLeave={(e) => (e.target.style.background = styles.checkButton.background)}
      >
        🔄
      </button>

      {hasFunds && (
        <button
          onClick={onWithdraw}
          style={styles.withdrawButton}
          title="Retirar Fondos"
          onMouseEnter={(e) => (e.target.style.background = styles.withdrawButtonHover.background)}
          onMouseLeave={(e) => (e.target.style.background = styles.withdrawButton.background)}
        >
          💰
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px',
    background: 'transparent', // para integrarse con la navbar
  },
  text: {
    color: '#cbd5e1', // slate-300
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
  },
  checkButton: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.2s ease',
  },
  checkButtonHover: {
    background: '#2563eb',
  },
  withdrawButton: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.2s ease',
  },
  withdrawButtonHover: {
    background: '#047857',
  },
};

export default BalanceSection;
