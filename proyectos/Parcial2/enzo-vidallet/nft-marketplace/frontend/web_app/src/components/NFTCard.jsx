import React from 'react';

const NFTCard = ({ nft, onPurchase }) => {
  return (
    <div className="nft-card">
      <img src={nft.image} alt={`NFT ${nft.tokenId}`} />
      <div className="nft-info">
        <h3>NFT #{nft.tokenId}</h3>
        <p>Price: {nft.price} ETH</p>
        <button onClick={onPurchase} className="buy-button">
          Buy NFT
        </button>
      </div>
    </div>
  );
};

export default NFTCard;