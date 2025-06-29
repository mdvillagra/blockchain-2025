export default function Header({ account, connectWallet }) {
  return (
    <header className="header">
      <h1 className="header-title">Panel DeFi</h1>
      <div className="wallet-status">
        {account ? (
          <span className="account-info">
            <span className="connection-dot"></span>
            Conectado: {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        ) : (
          <button className="connect-button" onClick={connectWallet}>
            Conectar con MetaMask
          </button>
        )}
      </div>
    </header>
  );
}