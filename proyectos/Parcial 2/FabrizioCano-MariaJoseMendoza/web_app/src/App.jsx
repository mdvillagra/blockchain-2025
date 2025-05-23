/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "./abi/Marketplace.json";
import "./App.css";
import MyNFTs from "./MisNFTs";

import { Routes, Route, Link } from "react-router-dom";
const contractAddr = import.meta.env.VITE_CONTRACT_ADDRESS;

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [marketItems, setMarketItems] = useState([]);
  const [myNfts, setMyNfts] = useState([]);

  let isConnecting = false;

  /* funcion que permite conectar con la billetera del cliente */
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask no detectado");
      return;
    }

    if (isConnecting) {
      console.log("Ya hay una solicitud pendiente en MetaMask.");
      return;
    }

    isConnecting = true;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);


    } catch (error) {
      if (error.code === -32002) {
        alert("Ya hay una solicitud pendiente en MetaMask. Espera a aceptarla o cancelarla.");
      } else {
        console.error("Error al conectar con MetaMask:", error);
      }
    } finally {
      isConnecting = false;
    }
  };


  /* funcion que permite obtener el contrato creado */

  const getContract = async (useSigner = false) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (useSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(contractAddr, contractAbi.abi, signer);
    } else {
      return new ethers.Contract(contractAddr, contractAbi.abi, provider);
    }
  };

  /* funcion que permite convertir links de ipfs (almacenamiento de las imagenes) a http/s de manera a depslegar las imagenes en el frontend*/
  const ipfsToHttp = (url) => {
    if (!url) return "";


    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const gateway = "https://gateway.pinata.cloud/ipfs/";
    //const gateway = "https://ipfs.io/ipfs/";


    if (url.startsWith("ipfs://")) {
      return `${gateway}${url.replace("ipfs://", "")}`;
    }


    return url;
  };


  /* Llama a getListing para todos los IDs y renderiza 
las tarjetas NFT.  */
  const loadMarketItems = async () => {
    const contract = await getContract(false);
    const items = [];
    const itemsSet = new Set();

    try {
      const total = await contract.nextTokenId();

      for (let i = 0; i < total; i++) {
        try {
          const [owner, price, isSold] = await contract.getListing(i);
          /* solo mostrara los nfts que no fueron comprados */
          if (!isSold) {
            const tokenURIFromContract = await contract.tokenURI(i);
            console.log("Token uri del contrato: " + tokenURIFromContract);
            const uri = tokenURIFromContract.endsWith('.json')
              ? tokenURIFromContract
              : `${tokenURIFromContract}.json`;


            const tokenURI = ipfsToHttp(uri); // Convertir la URI de IPFS a HTTP

            const res = await fetch(tokenURI);
            if (!res.ok) {
              console.warn(`Token ${i} no tiene metadata disponible en: ${tokenURI}`);
              continue;
            }

            const metadata = await res.json();
            console.log("Metadata:", metadata);
            /* convertir la imagen que se recibe a http para mostrarla en el frontend */
            const imageUrlf = ipfsToHttp(metadata.image);


            if (!itemsSet.has(i)) {
              items.push({
                id: i,
                owner,
                price: ethers.formatEther(price),
                image: imageUrlf,
                name: metadata.name,
              });
              itemsSet.add(i);
            }
          }
        } catch (e) {
          console.log(`Error al cargar token ${i}:`, e);
        }
      }
    } catch (err) {
      console.error("Error al obtener el número total de NFTs:", err);
    }

    setMarketItems(items);
  };

  /* Ejecuta buy, espera el tx.wait() y refresca la 
galería.  */
  const purchase = async (tokenId, price) => {
    if (!window.ethereum) {
      alert("MetaMask no está disponible. Instala MetaMask para continuar.");
      return;
    }
    //pregunta si ya esta conectada la billetera antes de comprar
    if (!currentAccount) {
      alert("Conecta tu billetera antes de comprar un NFT.");
      return;
    }

    let isWaitingForMetaMask = false;

    try {
      isWaitingForMetaMask = true;
      const contract = await getContract(true);
      const tx = await contract.buy(tokenId, {
        value: ethers.parseEther(price.toString()),
      });

      isWaitingForMetaMask = false;
      const receipt = await tx.wait();
      console.log("Gas usado:", receipt.gasUsed.toString());
      alert("NFT adquirido exitosamente.");
      loadMarketItems();
    } catch (error) {
      isWaitingForMetaMask = false;

      if (error.code === -32002) {
        alert("Ya hay una solicitud pendiente en MetaMask. Por favor, acepta o rechaza antes de continuar.");
      } else if (error.code === 4001) {
        alert("Transacción rechazada por el usuario.");
      } else {
        console.error("Error al intentar comprar:", error);
        alert("Ocurrió un error al procesar la compra.");
      }
    }
  };


  /* Crea 10 NFTs al iniciar.  */
  const mintInitialBatch = async () => {
    if (!currentAccount) {
      alert("Conecta tu wallet para mintear NFTs");
      return;
    }

    const baseUri = `https://gateway.pinata.cloud/ipfs/${import.meta.env.VITE_PINATA_URL}/`;
    //const baseUri = `https://ipfs.io/ipfs/${import.meta.env.VITE_METADATA_URL}/`;

    const listingFee = ethers.parseEther("0.01");

    try {
      const contract = await getContract(true);
      /* el token id representa cuantos nfts se tienen hasta el momento */
      const total = await contract.nextTokenId();
      let i = Number(total);

      const price = ethers.parseUnits("0.01", "ether");
      //mientras haya nfts que mostrar se ejecutara el ciclo
      while (true) {
        const tokenURI = `${baseUri}${i}.json`;

        const res = await fetch(tokenURI);
        console.log("Token uri: " + tokenURI + " Rta: " + res);
        if (!res.ok) break;

        const tx = await contract.mintAndList(tokenURI, price, {
          value: listingFee,
        });

        await tx.wait();

        console.log(`NFT #${i} minteado y listado`);
        i++;
      }

      alert("NFTs minteados y listados correctamente.");
      loadMarketItems();
    } catch (error) {
      console.error("Error al mintear NFTs:", error);
    }
  };

  //se chequea la conexion a la billetera y la cuenta del cliente
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }
      }
    };

    checkWalletConnection();
    loadMarketItems();
    /* loadMyNFTs(); */
  }, []);

  return (
    <div className="container items-center">
      <h1 className="text-center">NFT MARKETPLACE</h1>
      <nav style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>

        <Link to="/">Marketplace</Link>

      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <>
              {!currentAccount && (
                <button onClick={connectWallet}>Conectar Wallet</button>
              )}

              {currentAccount && (
                <button onClick={mintInitialBatch}>Mintear NTFs</button>
              )}

              <div className="nft-grid">
                {marketItems.map((item) => (
                  <div key={item.id} className="nft-card">
                    <img src={item.image} alt={item.name} />
                    <h2>{item.name}</h2>
                    <p>{item.price} ETH</p>
                    <button onClick={() => purchase(item.id, item.price)}>
                      Comprar
                    </button>
                  </div>
                ))}
              </div>
            </>
          }
        />

      </Routes>
    </div>
  );
}


export default App;
