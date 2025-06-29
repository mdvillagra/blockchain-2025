import React from 'react';

const NFTCard = ({ nft, purchase, account }) => {
  return (
    <div className="nft-card">
      <div className="nft-image-container">
        <img 
          src={nft.tokenURI} 
          alt={`NFT ${nft.id}`}
          className="nft-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/300";
          }}
        />
      </div>
      <div className="nft-details">
        <h3 className="nft-title">NFT #{nft.id}</h3>
        <p className="nft-price">{nft.price} ETH</p>
        <button 
          className="buy-button"
          onClick={() => purchase(nft.id, nft.price)}
          disabled={!account || account === nft.owner}
        >
          {account === nft.owner ? 'Tu NFT' : 'Comprar'}
        </button>
      </div>
    </div>
  );
};

export default NFTCard;