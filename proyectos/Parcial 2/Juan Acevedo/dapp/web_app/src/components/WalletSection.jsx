const WalletSection = ({ currentAccount, connectWallet }) => {
  return (
    <div style={styles.container}>
      {!currentAccount ? (
        <button 
          onClick={connectWallet}
          style={styles.button}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
            alt="MetaMask Logo" 
            style={styles.icon}
          />
          Conectar MetaMask
        </button>
      ) : (
        <p style={styles.connectedAccount}>
          Cuenta conectada: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 24px',
    backgroundColor: '#f6851b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    ':hover': {
      backgroundColor: '#e2761b',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
    },
    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
    }
  },
  icon: {
    width: '24px',
    height: '24px'
  },
  connectedAccount: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: '16px'
  }
};

export default WalletSection;