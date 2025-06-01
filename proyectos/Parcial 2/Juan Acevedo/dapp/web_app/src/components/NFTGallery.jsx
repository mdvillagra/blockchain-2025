import { useState } from 'react';

const NFTGallery = ({ loading, nfts, purchase, currentAccount }) => {
  const [selectedNft, setSelectedNft] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const handleBuyClick = (nft) => {
    setSelectedNft(nft);
    setShowPriceModal(true);
  };

  const closeModal = () => {
    setShowPriceModal(false);
  };

  return (
    <div className="card" style={{display: "flex", flexWrap: "wrap", gap: "20px", padding: "20px"}}>
      {loading ? (
        <div className="read-the-docs" style={{width: "100%"}}>Cargando NFTs...</div>
      ) : nfts.length === 0 ? (
        <div style={{width: "100%"}}>No hay NFTs disponibles</div>
      ) : (
        nfts.map((nft) => (
          <div 
            key={nft.tokenId} 
            className="card" 
            style={{ 
              width: "180px",
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "15px",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 15px 35px rgba(0, 0, 0, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.5)";
            }}
          >
            {/* Efecto de halo radiante */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(circle at center, rgba(100, 108, 255, 0.15) 0%, transparent 70%)",
              zIndex: 0,
              pointerEvents: "none"
            }}></div>
            
            {/* Efecto de rayos de luz */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "150%",
              height: "150%",
              background: "conic-gradient(transparent 0deg, transparent 90deg, rgba(255, 255, 255, 0.1) 90deg, rgba(255, 255, 255, 0.1) 180deg, transparent 180deg, transparent 270deg, rgba(100, 108, 255, 0.1) 270deg, rgba(100, 108, 255, 0.1) 360deg)",
              transform: "translate(-50%, -50%) rotate(0deg)",
              animation: "rotateRays 20s linear infinite",
              opacity: 0.5,
              zIndex: 0,
              pointerEvents: "none"
            }}></div>
            
            {/* Borde brillante */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "16px",
              border: "1px solid transparent",
              background: "linear-gradient(45deg, rgba(100, 108, 255, 0.3), rgba(255, 255, 255, 0.1), rgba(100, 108, 255, 0.3)) border-box",
              mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              pointerEvents: "none",
              zIndex: 0
            }}></div>
            
            <img
              src={nft.image}
              alt={`NFT ${nft.tokenId}`}
              style={{ 
                width: "100%", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "12px",
                position: "relative",
                zIndex: 1,
                background: "linear-gradient(45deg, #1a1a1a, #2a2a2a)"
              }}
            />
            <p style={{
              color: "#fff", 
              margin: "5px 0",
              position: "relative",
              zIndex: 1,
              textShadow: "0 0 5px rgba(100, 108, 255, 0.5)"
            }}>
              <strong>Nombre:</strong> {nft.name}
            </p>

            {currentAccount ? (
              <button 
                onClick={() => handleBuyClick(nft)}
                style={{
                  background: "linear-gradient(45deg, #646cff, #535bf2)",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.3s",
                  width: "100%",
                  marginTop: "10px",
                  position: "relative",
                  zIndex: 1,
                  overflow: "hidden",
                  boxShadow: "0 0 10px rgba(100, 108, 255, 0.5)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(100, 108, 255, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(100, 108, 255, 0.5)";
                }}
              >
                Comprar
                <span style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background: "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  transform: "rotate(30deg)",
                  transition: "all 0.5s ease",
                  opacity: 0
                }}></span>
              </button>
            ) : (
              !currentAccount && (
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.8rem',
                  padding: "8px",
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "4px",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                  border: "1px solid rgba(100, 108, 255, 0.2)"
                }}>
                  Conecta tu wallet para comprar
                </div>
              )
            )}
          </div>
        ))
      )}

      {/* Modal de precio */}
      {showPriceModal && selectedNft && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s',
          }}
        >
          <div 
            style={{
              background: 'rgba(10, 10, 10, 0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '25px',
              maxWidth: '300px',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              border: '1px solid rgba(100, 108, 255, 0.3)',
              transform: 'scale(1)',
              animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Efecto de vidrio para el modal */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(45deg, transparent, rgba(100, 108, 255, 0.1), transparent)',
              transform: 'rotate(30deg)',
              opacity: 0.5,
              pointerEvents: 'none'
            }}></div>
            
            {/* Efecto de destello radial */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at center, rgba(100, 108, 255, 0.2) 0%, transparent 70%)',
              zIndex: 0,
              pointerEvents: 'none'
            }}></div>
            
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 2,
                textShadow: '0 0 5px rgba(100, 108, 255, 0.8)'
              }}
            >
              ×
            </button>
            
            <h3 style={{ 
              marginTop: 0, 
              color: '#646cff', 
              position: 'relative', 
              zIndex: 1,
              textShadow: '0 0 10px rgba(100, 108, 255, 0.5)',
              fontSize: '1.5rem'
            }}>
              Detalles de compra
            </h3>
            
            <div style={{ 
              margin: '20px 0', 
              position: 'relative', 
              zIndex: 1,
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'inline-block',
              boxShadow: '0 0 20px rgba(100, 108, 255, 0.3)'
            }}>
              <img 
                src={selectedNft.image} 
                alt={`NFT ${selectedNft.tokenId}`} 
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid rgba(100, 108, 255, 0.5)',
                  boxShadow: '0 5px 15px rgba(100, 108, 255, 0.2)',
                  position: 'relative',
                  zIndex: 1,
                  background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)'
                }} 
              />
              {/* Efecto de halo alrededor de la imagen */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                right: '-10px',
                bottom: '-10px',
                background: 'radial-gradient(circle at center, rgba(100, 108, 255, 0.3) 0%, transparent 70%)',
                zIndex: 0,
                borderRadius: '16px'
              }}></div>
            </div>
            
            <p style={{ 
              fontSize: '18px', 
              marginBottom: '5px', 
              color: '#fff', 
              position: 'relative', 
              zIndex: 1,
              textShadow: '0 0 5px rgba(100, 108, 255, 0.5)'
            }}>
              <strong>{selectedNft.name}</strong>
            </p>
            
            <div style={{
              background: 'rgba(100, 108, 255, 0.15)',
              padding: '15px',
              borderRadius: '12px',
              margin: '15px 0',
              borderLeft: '4px solid #646cff',
              position: 'relative',
              zIndex: 1,
              backdropFilter: 'blur(5px)',
              boxShadow: '0 5px 15px rgba(100, 108, 255, 0.1)',
              border: '1px solid rgba(100, 108, 255, 0.2)'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'rgba(255,255,255,0.8)',
                textShadow: '0 0 3px rgba(100, 108, 255, 0.3)'
              }}>
                Precio actual
              </p>
              <p style={{ 
                margin: '5px 0 0 0',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#646cff',
                textShadow: '0 0 10px rgba(100, 108, 255, 0.5)'
              }}>
                {selectedNft.price} ETH
              </p>
            </div>
            
            <button 
              onClick={() => {
                purchase(selectedNft.tokenId, selectedNft.price);
                closeModal();
              }}
              style={{
                background: 'linear-gradient(45deg, #646cff, #535bf2)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                width: '100%',
                position: 'relative',
                zIndex: 1,
                overflow: 'hidden',
                boxShadow: '0 0 15px rgba(100, 108, 255, 0.5)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(45deg, #535bf2, #434af0)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(100, 108, 255, 0.8)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(45deg, #646cff, #535bf2)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(100, 108, 255, 0.5)';
              }}
            >
              Comprar ahora
              <span style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transform: 'rotate(30deg)',
                transition: 'all 0.5s ease',
                opacity: 0
              }}></span>
            </button>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes rotateRays {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NFTGallery;