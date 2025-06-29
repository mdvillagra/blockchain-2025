import { ethers } from "ethers";

export default function Marketplace({ currentAccount, connectWallet, mintInitialBatch, marketItems, purchase, withdrawFunds, withdrawableBalance }) {
  return (
    <div className="marketplace-container">
      <h1>Marketplace NFTs</h1>

      {!currentAccount ? (
        <>
          <div className="btn-group">
            <button className="primary" onClick={connectWallet}>Conectar Wallet</button>
          </div>
          <p>Conecta tu wallet para ver los NFTs disponibles.</p>
        </>
      ) : (
        <>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
            <p style={{fontSize: '0.9em', color: '#10b981'}}>
              Conectado: {currentAccount && `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`}
            </p>
            <button className="secondary" onClick={mintInitialBatch}> Mint inicial</button>
            <button className="withdraw" onClick={withdrawFunds} disabled={withdrawableBalance === "0.0"}>
              Retirar {withdrawableBalance} ETH
            </button>

          </div>

          <h2>Items en venta:</h2>
          <div className="nft-grid">    
            {marketItems.map((item) => (
              <div key={item.tokenId} className="nft-card">
                <img src={item.image} alt={`NFT ${item.tokenId}`} style={{
                                                                    width: "100%",
                                                                    height: "200px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "10px"
                                                                }} />
                <p>Nombre: {item.name}</p>
                <p style={{ wordBreak: 'break-word', fontSize: '0.8em' }}>Vendedor: {item.seller}</p>
                <p>Precio: {ethers.formatEther(item.price)} ETH</p>
                <span className={`nft-status ${item.isSold ? 'sold' : 'available'}`}>
                {item.isSold ? "Vendido" : "Disponible"}
              </span>
                {!item.isSold && (
                  <button className="buy" onClick={() => purchase(item.tokenId, item.price)}>
                    Comprar
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
