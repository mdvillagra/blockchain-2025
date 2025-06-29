import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MarketplaceAbi from '../abis/Marketplace.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const rpcUrl = import.meta.env.VITE_RPC_URL;


// Convierte ipfs:// a una URL usable
const resolveIPFS = (uri) => {
  return uri.startsWith("ipfs://")
    ? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
    : uri;
};

// export function useNFTMarketplace() {
//   const [provider, setProvider] = useState(null);
//   const [signer, setSigner] = useState(null);
//   const [contract, setContract] = useState(null);
//   const [account, setAccount] = useState(null);
//   const [nfts, setNfts] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Conecta MetaMask y prepara contrato
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

//   // Carga todos los NFTs listados
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

//   useEffect(() => {
//     connectWallet();
//   }, []);

//   useEffect(() => {
//     if (contract) loadMarketItems();
//   }, [contract]);

//   return {
//     provider,
//     signer,
//     contract,
//     account,
//     nfts,
//     loading,
//     connectWallet,
//     loadMarketItems
//   };
// }


export function useNFTMarketplace() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Conexión opcional de la wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Por favor instala MetaMask");
      return;
    }
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const connectedContract = new ethers.Contract(contractAddress, MarketplaceAbi, signer);

      setProvider(browserProvider);
      setSigner(signer);
      setContract(connectedContract);
      setAccount(accs[0]);
    } catch (error) {
      console.error("Error conectando wallet:", error);
    }
  };

  // Cargar NFTs con un provider público
  const loadMarketItems = async () => {
    setLoading(true);
    const items = [];

    try {
      const publicProvider = new ethers.JsonRpcProvider(rpcUrl);
      const readOnlyContract = new ethers.Contract(contractAddress, MarketplaceAbi, publicProvider);

      const tokenCounter = await readOnlyContract.tokenCounter();
      for (let i = 0; i < Number(tokenCounter); i++) {
        try {
          const [owner, price, isSold] = await readOnlyContract.getListing(i);
          if (!isSold && owner !== ethers.ZeroAddress) {
            const tokenURI = await readOnlyContract.tokenURI(i);
            const metadataRes = await fetch(resolveIPFS(tokenURI));
            const metadata = await metadataRes.json();

            items.push({
              tokenId: i,
              owner,
              price: ethers.formatEther(price),
              image: resolveIPFS(metadata.image),
              name: metadata.name,
              description: metadata.description,
            });
          }
        } catch (err) {
          console.warn(`Token ID ${i} inválido:`, err.message);
        }
      }
      setNfts(items);
    } catch (err) {
      console.error("Error al cargar NFTs:", err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadMarketItems();
  }, []);

  return {
    provider,
    signer,
    contract,
    account,
    nfts,
    loading,
    connectWallet,
    loadMarketItems,
  };
}