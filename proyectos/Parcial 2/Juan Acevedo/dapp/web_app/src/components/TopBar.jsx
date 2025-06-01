import MintButton from "./MintButton";
import BalanceSection from "./BalanceSection";

const TopBar = ({ 
  currentAccount, 
  connectWallet, 
  mintInitialBatch,
  sellerBalance,
  checkSellerBalance,
  withdrawFunds
}) => {
  const styles = {
    bar: {
      width: '100%',
      minHeight: '60px',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    },
    contentWrapper: {
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    centerText: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: currentAccount ? '#4CAF50' : '#ccc',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    walletButton: {
      backgroundColor: '#f6851b',
      color: 'white',
      border: 'none',
      padding: '10px 16px',
      borderRadius: '6px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'background-color 0.2s ease'
    },
    icon: {
      width: '20px',
      height: '20px'
    }
  };

  return (
    <div style={styles.bar}>
      <div style={styles.contentWrapper}>
        {/* Izquierda - Mint */}
        {currentAccount && <MintButton mintInitialBatch={mintInitialBatch} compact />}

        {/* Centro - Estado de conexión */}
        <div style={styles.centerText}>
          {!currentAccount
            ? "No conectado"
            : <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#4CAF50',
                  borderRadius: '50%',
                  display: 'inline-block'
                }}></span>
                <span>{`Conectado: ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`}</span>
              </div>
          }
        </div>

        {/* Derecha - Balance + Botón conectar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentAccount && (
            <BalanceSection 
              sellerBalance={sellerBalance}
              onCheckBalance={checkSellerBalance}
              onWithdraw={withdrawFunds}
            />
          )}

          {!currentAccount && (
            <button 
              onClick={connectWallet} 
              style={styles.walletButton}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e67815'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f6851b'}
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask Logo" 
                style={styles.icon}
              />
              Conectar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;