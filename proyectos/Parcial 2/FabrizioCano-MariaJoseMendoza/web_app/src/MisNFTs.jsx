import { useEffect } from "react";
import "./App.css";
function MyNFTs({ currentAccount, myNfts, loadMyNFTs }) {
  useEffect(() => {
    if (currentAccount) {
      loadMyNFTs();
    }
  }, [currentAccount]);

  return (
    <div className="container">
      <h2 className="text-center">Mis NFTs</h2>
      {myNfts.length === 0 && <p className="text-center">No tienes NFTs comprados aún.</p>}
      <div className="nft-grid">
        {myNfts.map((nft) => (
          <div key={nft.id} className="nft-card">
            <img src={nft.image} alt={nft.name} />
            <h3>{nft.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyNFTs;
