import React from 'react';

const NFTGallery = ({ nfts, loading, purchase, account }) => {
  return (
    <div className="gallery-container">
      <h2>NFTs en Venta</h2>
      
      {loading ? (
        <p>Cargando NFTs...</p>
      ) : nfts.length === 0 ? (
        <p>No hay NFTs disponibles en este momento.</p>
      ) : (
        <div className="nft-grid">
          {nfts.map(nft => (
            <div key={nft.id} className="nft-card">
              <img 
                src={nft.tokenURI} 
                alt={`NFT ${nft.id}`} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300";
                }}
              />
              <div className="nft-info">
                <h3>NFT #{nft.id}</h3>
                <p>Precio: {nft.price} ETH</p>
                <button 
                  onClick={() => purchase(nft.id, nft.price)}
                  disabled={!account || account === nft.owner}
                >
                  {account === nft.owner ? "Tuyo" : "Comprar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;