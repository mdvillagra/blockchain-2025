import { useState } from 'react';
import { ethers } from 'ethers';

// export function useNFTPurchase(contract, onSuccess) {
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState(null);

//   // Función para comprar un NFT específico
//   const purchaseNFT = async (tokenId, price) => {
//     if (!contract) {
//       setError("Wallet no conectada");
//       return false;
//     }
    
//     setProcessing(true);
//     setError(null);
    
//     try {
//       const tx = await contract.buy(tokenId, {
//         value: ethers.parseEther(price),
//       });
//       await tx.wait();
      
//       console.log("Compra exitosa", tx.hash);
//       if (onSuccess) onSuccess();
      
//       return true;
//     } catch (err) {
//       console.error("Error al comprar:", err.message);
//       setError(err.message);
//       return false;
//     } finally {
//       setProcessing(false);
//     }
//   };

//   return {
//     purchaseNFT,
//     processing,
//     error
//   };
// }

export function useNFTPurchase(contract, onSuccess) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const purchaseNFT = async (tokenId, price) => {
    if (!contract) {
      setError("Wallet no conectada");
      return false;
    }

    setProcessing(true);
    setError(null);

    try {
      const tx = await contract.buy(tokenId, {
        value: ethers.parseEther(price),
      });
      await tx.wait();

      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      console.error("Error al comprar:", err.message);
      setError(err.message);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    purchaseNFT,
    processing,
    error
  };
}