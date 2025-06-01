import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "./abi.json";
import NFTGallery from "./components/NFTGallery";
import TopBar from "./components/TopBar";
import './App.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;


function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerBalance, setSellerBalance] = useState(null); // null = no consultado aún

  useEffect(() => {
    loadMarketItems();
  }, []);

  // Función para consultar balance
  const checkSellerBalance = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const balance = await contract.getBalance(currentAccount);
      setSellerBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error al verificar balance:", error);
      setSellerBalance("0");
    }
  };

  // Función para retirar
  const withdrawFunds = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      const tx = await contract.withdraw();
      await tx.wait();
      
      setSellerBalance("0"); // Actualizamos inmediatamente el estado
      alert("¡Fondos retirados con éxito!");
    } catch (error) {
      alert("Error al retirar: " + error.message);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("Instala MetaMask");
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      alert("Error al conectar: " + error.message);
    }
  };

  const mintInitialBatch = async (name, price) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // 1. Obtener IDs
      const lastTokenId = await contract.getCurrentTokenId();
      const nextTokenId = lastTokenId + 1n;

      // 2. Generar URI
      const prime = 37n;
      const uniqueNumber = nextTokenId * prime;
      const tokenURI = `https://robohash.org/${encodeURIComponent(name)}/${uniqueNumber}?set=set1&size=200x200`;

      // 3. Enviar la transacción
      const tx = await contract.mintAndList(tokenURI, ethers.parseEther(price));
      await tx.wait(); // ✅ Esperar a que se confirme la transacción

      alert(`¡NFT "${name}" creado!`);
      await updateNfts();

    } catch (error) {
      alert("Error al mintear: " + error.message);
    }
  };

  const loadMarketItems = async () => {
    setLoading(true);
    await updateNfts();
    setLoading(false);
  };

  const purchase = async (tokenId, price) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.buy(tokenId, {
        value: ethers.parseEther(price)
      });
      const receipt = await tx.wait();
      alert(`NFT ${tokenId} comprado con éxito con gas usado: ${receipt.gasUsed.toString()}`);
      await updateNfts();
    } catch (error) {
      const code = error?.code;
      const innerCode = error?.info?.error?.code;
      const msg = error?.message?.toLowerCase();

      if (
        code === "ACTION_REJECTED" || // ethers.js v6
        innerCode === 4001 ||         // error anidado (MetaMask)
        (msg && msg.includes("user denied")) ||
        (msg && msg.includes("user rejected"))
      ) {
        console.log("Transacción cancelada por el usuario.");
        return;
      }

      // Detectar fondos insuficientes
      if (
        code === "CALL_EXCEPTION" ||
        (msg && msg.includes("insufficient funds")) ||
        (msg && msg.includes("not enough funds")) ||
        (msg && msg.includes("exceeds balance"))
      ) {
        alert("Fondos insuficientes para completar la compra.");
        return;
      }

      console.error("Error real al comprar NFT:", error);
      alert("Error al comprar: " + (error?.message || "Error desconocido"));
    }
  };
  const updateNfts = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const lastTokenId = await contract.getCurrentTokenId();
      const items = [];

      for (let i = 1; i <= lastTokenId; i++) {
        try {
          const [owner, price, isSold] = await contract.getListing(i);
          if (!isSold) {
            const tokenURI = await contract.tokenURI(i);
            const nameSegment = tokenURI.split('org/')[1].split('/')[0];
            items.push({
              tokenId: i,
              name: decodeURIComponent(nameSegment),
              price: ethers.formatEther(price),
              image: tokenURI
            });
          }
        } catch (e) {
          console.log(`Error cargando NFT ${i}:`, e);
        }
      }

      setNfts(items);
    } catch (error) {
      console.log("Error al cargar NFTs: " + error.message);
    }
  };


  return (
    <>
      <TopBar 
        currentAccount={currentAccount} 
        connectWallet={connectWallet} 
        mintInitialBatch={mintInitialBatch}
        sellerBalance={sellerBalance}
        checkSellerBalance={checkSellerBalance}
        withdrawFunds={withdrawFunds}
      />

      <div className="card">
        <NFTGallery 
          loading={loading} 
          nfts={nfts} 
          purchase={purchase} 
          currentAccount={currentAccount} 
        />
      </div>
    </>
  );
}

export default App;
