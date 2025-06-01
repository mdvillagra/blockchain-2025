import { FaEthereum } from "react-icons/fa";
import { BsCheckCircleFill } from "react-icons/bs";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { TbCoins } from "react-icons/tb";
import type { NFTItem } from "../utils/marketplace";
import { useEffect, useState } from "react";

type Props = {
  nft: NFTItem;
  onBuy: (tokenId: number, price: string) => void;
  currentAccount?: string;
};

export default function NFTCard({ nft, onBuy, currentAccount }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isOwner = currentAccount?.toLowerCase() === nft.owner.toLowerCase();
  const isSold = nft.isSold;

  const cardStyle = {
    border: "1px solid #333",
    borderRadius: "14px",
    width: "250px",
    margin: "10px",
    padding: "16px",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    textAlign: "center" as const,
  };

  // Convierte ipfs://... a https://... para los gateways
  const ipfsToHttp = (ipfsUri: string) =>
    ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");

  // Carga el metadata JSON y extrae la imagen
  useEffect(() => {
    const fetchImageFromMetadata = async () => {
      try {
        const metadataUrl = ipfsToHttp(nft.uri);
        const res = await fetch(metadataUrl);
        const json = await res.json();
        setImageUrl(ipfsToHttp(json.image));
      } catch (err) {
        console.error(`❌ Error cargando metadata de NFT ${nft.tokenId}:`, err);
      }
    };

    fetchImageFromMetadata();
  }, [nft.uri, nft.tokenId]);

  return (
    <div style={cardStyle}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`NFT ${nft.tokenId}`}
          width="100%"
          height="200px"
          style={{
            objectFit: "cover",
            borderRadius: "10px",
            marginBottom: "12px",
          }}
        />
      ) : (
        <div style={{ height: "200px", marginBottom: "12px", color: "#888" }}>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                border: "8px solid #f3f3f3",
                borderTop: "8px solid #3498db",
                borderRadius: "50%",
                width: "80px",
                height: "80px",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        </div>
      )}
      <h3
        style={{ margin: "0 0 6px", fontSize: "1.1rem" }}
      >{`NFT #${nft.tokenId}`}</h3>
      <p
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FaEthereum /> {nft.price} ETH
      </p>

      {isSold && (
        <p style={{ color: "lime", fontWeight: "bold", marginTop: "10px" }}>
          <BsCheckCircleFill /> Comprado
        </p>
      )}

      {!isOwner && !isSold && currentAccount != "" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => onBuy(nft.tokenId, nft.price)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            <AiOutlineShoppingCart /> Comprar
          </button>
        </div>
      )}

      {isOwner && !isSold && (
        <p style={{ color: "gold", fontWeight: "bold", marginTop: "10px" }}>
          <TbCoins /> A la venta (tuyo)
        </p>
      )}
    </div>
  );
}
