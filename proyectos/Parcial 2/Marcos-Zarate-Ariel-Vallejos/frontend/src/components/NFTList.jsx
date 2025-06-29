import React, { useState } from 'react';
import NFTCard from './NFTCard';
import { useNFTMarketplace } from '../hooks/useNFTMarketplace';
import { mintInitialBatch } from '../utils/mintInitialBatch';

function NFTList() {
  const [viewType, setViewType] = useState('grid');
  const [isMinting, setIsMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState(null);
  const { nfts, loading, contract, account, connectWallet, loadMarketItems } = useNFTMarketplace();

  const handleMintBatch = async () => {
    if (!account) {
      alert("Por favor conecta tu billetera primero");
      return;
    }
    
    setIsMinting(true);
    setMintMessage("Acuñando 10 NFTs, esto puede tomar un tiempo...");
    
    try {
      const result = await mintInitialBatch();
      if (result.success) {
        setMintMessage(`¡Acuñación exitosa! ${result.mintedTokens.length} NFTs fueron creados.`);
        // Reload the marketplace items to show the new NFTs
        await loadMarketItems();
      } else {
        setMintMessage(`Acuñación parcial o fallida. Revisa la consola para más detalles.`);
      }
    } catch (error) {
      console.error("Error en la acuñación:", error);
      setMintMessage(`Error al acuñar NFTs: ${error.message}`);
    } finally {
      setIsMinting(false);
      // Auto-hide message after 5 seconds
      setTimeout(() => setMintMessage(null), 5000);
    }
  };

  return (
    <div className="w-full">
      {!account && (
        <div className="text-center mb-6">
          <p className="text-yellow-400">
            ⚠️ Conectá tu billetera para poder comprar NFTs
          </p>
          <button
            onClick={connectWallet}
            className="btn mt-2 btn-primary"
          >
            Conectar Wallet
          </button>
        </div>
      )}
      
      {account && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1"></div>
          <button
            onClick={handleMintBatch}
            disabled={isMinting}
            className={`btn btn-secondary ${isMinting ? 'loading' : ''}`}
          >
            {isMinting ? 'Acuñando NFTs...' : 'Acuñar 10 NFTs Iniciales'}
          </button>
        </div>
      )}
      
      {mintMessage && (
        <div className={`alert ${mintMessage.includes('exitosa') ? 'alert-success' : mintMessage.includes('Error') ? 'alert-error' : 'alert-info'} mb-4`}>
          {mintMessage}
        </div>
      )}

      <div
        className={`grid ${
          viewType === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }`}
      >
        {loading ? (
          <div className="col-span-full text-center">
            <p className="text-gray-500">Cargando NFTs...</p>
          </div>
        ) : nfts.length > 0 ? (
          nfts.map((nft) => (
            <div
              key={nft.tokenId}
              className="bg-[hsl(240_17%_14%)] rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-[hsl(270_60%_60%)/0.2] border border-[hsl(240_10%_20%)]"
            >
              <NFTCard
                {...nft}
                contract={contract}
                onSuccessfulPurchase={loadMarketItems}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center">
            <p className="text-gray-500">No hay NFTs disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NFTList;
