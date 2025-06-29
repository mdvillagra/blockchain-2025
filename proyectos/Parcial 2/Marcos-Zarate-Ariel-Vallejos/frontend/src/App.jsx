import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import MarketplaceAbi from "./abis/Marketplace.json";
import { Toaster } from 'react-hot-toast';

import Index from "./pages/Index"
// Variables de entorno
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const rpcUrl = import.meta.env.VITE_RPC_URL;

// Convierte ipfs:// a una URL usable
const resolveIPFS = (uri) => {
  return uri.startsWith("ipfs://")
    ? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
    : uri;
};

// function App() {
//   const [provider, setProvider] = useState(null);
//   const [signer, setSigner] = useState(null);
//   const [contract, setContract] = useState(null);
//   const [account, setAccount] = useState(null);
//   const [nfts, setNfts] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // 1. Conecta MetaMask y prepara contrato
//   const connectWallet = async () => {
//     if (!window.ethereum) {
//       alert("Por favor instala MetaMask");
//       return;
//     }

//     try {
//       const accs = await window.ethereum.request({
//         method: "eth_requestAccounts",
//       });

//       const browserProvider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await browserProvider.getSigner();
//       const contract = new ethers.Contract(contractAddress, MarketplaceAbi, signer);

//       setProvider(browserProvider);
//       setSigner(signer);
//       setContract(contract);
//       setAccount(accs[0]);

//       console.log("Wallet conectada:", accs[0]);
//     } catch (error) {
//       console.error("Error conectando MetaMask:", error);
//     }
//   };

//   // 2. Carga todos los NFTs listados
//   const loadMarketItems = async () => {
//     if (!contract) return;
//     setLoading(true);
//     const items = [];

//     try {
//       const tokenCounter = await contract.tokenCounter();
//       for (let i = 0; i < Number(tokenCounter); i++) {
//         try {
//           const [owner, price, isSold] = await contract.getListing(i);
//           if (!isSold && owner !== ethers.ZeroAddress) {
//             const tokenURI = await contract.tokenURI(i);
//             const metadataRes = await fetch(resolveIPFS(tokenURI));
//             const metadata = await metadataRes.json();

//             items.push({
//               tokenId: i,
//               owner,
//               price: ethers.formatEther(price),
//               image: resolveIPFS(metadata.image),
//               name: metadata.name,
//               description: metadata.description,
//             });
//           }
//         } catch (err) {
//           console.warn(`Token ID ${i} no válido:`, err.message);
//         }
//       }
//     } catch (err) {
//       console.error("Error al cargar NFTs:", err.message);
//     }

//     setNfts(items);
//     setLoading(false);
//   };

//   // 3. Comprar NFT
//   const purchase = async (tokenId, price) => {
//     if (!contract) return;
//     try {
//       const tx = await contract.buy(tokenId, {
//         value: ethers.parseEther(price),
//       });
//       await tx.wait();
//       alert("¡Compra exitosa!");
//       await loadMarketItems(); // Refrescar sin recargar la página
//     } catch (err) {
//       console.error("Error al comprar:", err.message);
//     }
//   };

//   useEffect(() => {
//     connectWallet();
//   }, []);

//   useEffect(() => {
//     if (contract) loadMarketItems();
//   }, [contract]);

//   return (
//     <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
//       <h1>🎨 Marketplace de NFTs</h1>
//       {account ? (
//         <p>✅ Conectado como: {account}</p>
//       ) : (
//         <button onClick={connectWallet}>Conectar Wallet</button>
//       )}

//       {loading ? (
//         <p>Cargando NFTs...</p>
//       ) : (
//         <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
//           {nfts.length === 0 && <p>No hay NFTs listados.</p>}
//           {nfts.map((nft) => (
//             <div
//               key={nft.tokenId}
//               style={{
//                 width: 250,
//                 border: "1px solid #ccc",
//                 borderRadius: 10,
//                 padding: 10,
//                 background: "#fff",
//               }}
//             >
//               <img
//                 src={nft.image}
//                 alt={nft.name}
//                 style={{ width: "100%", borderRadius: 5 }}
//               />
//               <h3>{nft.name}</h3>
//               <p>{nft.description}</p>
//               <p>
//                 <strong>{nft.price} ETH</strong>
//               </p>
//               <button onClick={() => purchase(nft.tokenId, nft.price)}>
//                 Comprar
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          // Estilos personalizados para toasts
          style: {
            background: 'hsl(240 17% 14%)',
            color: '#fff',
          },
          // Configuración específica para tipos de toast
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
          },
        }}
      />
      <div>
        <Index />
      </div>
    </>
  );
}

export default App;
