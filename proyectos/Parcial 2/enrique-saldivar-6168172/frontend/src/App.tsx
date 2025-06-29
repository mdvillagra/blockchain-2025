import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import MarketplaceABI from "./abi/Marketplace.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MarketplaceItem {
  tokenId: number;
  owner: string;
  price: string;
  image: string;
  name: string;
  description: string;
}

function App() {
  // Estados
  const [currentAccount, setCurrentAccount] = useState("");
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(
    null
  );
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<
    MarketplaceItem[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [contractOwner, setContractOwner] = useState<string>("");
  const [totalTokens, setTotalTokens] = useState<number>(0);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_RPC_URL;
  const ipfsGateway =
    import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs";

  const setupSignerAndContract = useCallback(
    async (account: string) => {
      if (!window.ethereum || !account || !contractAddress) return;

      const web3Provider = new ethers.providers.Web3Provider(
        window.ethereum as unknown as ethers.providers.ExternalProvider
      );

      const signer = web3Provider.getSigner(account);
      setSigner(signer);

      const marketPlaceContract = new ethers.Contract(
        contractAddress,
        MarketplaceABI.abi,
        signer
      );
      setContract(marketPlaceContract);

      // obtener dueño del contrato
      try {
        const owner = await marketPlaceContract.owner();
        setContractOwner(owner);
        // obtener total de tokens para controlar mint batch
        try {
          const count = await marketPlaceContract.totalTokens();
          setTotalTokens(count.toNumber());
        } catch {}
      } catch {}
    },
    [contractAddress]
  );

  const loadMarketItems = useCallback(
    async (contract: ethers.Contract) => {
      if (!contract) {
        if (contractAddress && rpcUrl && MarketplaceABI) {
          const readOnlyProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
          contract = new ethers.Contract(
            contractAddress,
            MarketplaceABI.abi,
            readOnlyProvider
          );
        } else {
          console.error("Contract address, RPC URL, or ABI is missing");
          return;
        }
      }

      setLoading(true);

      try {
        const items: MarketplaceItem[] = [];
        const totalTokens = await contract.totalTokens();

        for (let i = 1; i <= totalTokens.toNumber(); i++) {
          try {
            const listing = await contract.getListing(i);

            if (listing.isSold) {
              continue;
            }
            let tokenURI = await contract.tokenURI(i);

            // Si la URI comienza con ipfs://, convertirla a URL accesible
            if (tokenURI.startsWith("ipfs://")) {
              tokenURI = tokenURI.replace("ipfs://", `${ipfsGateway}/`);
            }

            console.log("Fetching", tokenURI);

            const metadataResponse = await fetch(tokenURI);
            const metadata = await metadataResponse.json();

            items.push({
              tokenId: i,
              owner: listing.owner,
              price: ethers.utils.formatEther(listing.price),
              image: metadata.image,
              name: metadata.name,
              description: metadata.description,
            });
          } catch (tokenError) {
            console.error("Error fetching token data:", tokenError);
          }
        }
        setMarketplaceItems(items);
      } catch (error) {
        console.error("Error loading market items:", error);
      }

      setLoading(false);
    },
    [contractAddress, rpcUrl, ipfsGateway]
  );

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("MetaMask is not installed!");
        return;
      }

      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];

      if (accounts?.length > 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        setupSignerAndContract(account);
        return;
      }

      console.log("No authorized account found");
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  }, [setupSignerAndContract]);

  useEffect(() => {
    const readonlyProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

    if (contractAddress) {
      const readOnlyContract = new ethers.Contract(
        contractAddress,
        MarketplaceABI.abi,
        readonlyProvider
      );

      loadMarketItems(readOnlyContract);
    }

    checkIfWalletIsConnected();
  }, [contractAddress, rpcUrl, loadMarketItems, checkIfWalletIsConnected]);

  useEffect(() => {
    if (contract) {
      loadMarketItems(contract);
    }
  }, [contract, loadMarketItems]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Instala MetaMask!");
        return;
      }

      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      console.log("Conectado:", accounts?.[0]);

      setCurrentAccount(accounts[0]);
      await setupSignerAndContract(accounts[0]);
      if (contract) loadMarketItems(contract);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const purchase = async (tokenId: number, price: string) => {
    if (!contract || !signer) {
      alert("Conecta tu wallet primero");
      return;
    }

    setLoading(true);
    console.log("Purchasing token:", tokenId, "for price:", price);

    try {
      const priceInWei = ethers.utils.parseEther(price);
      const transaction = await contract.buy(tokenId, { value: priceInWei });
      console.log("Transaction sent:", transaction);
      const receipt = await transaction.wait();
      console.log("Transaction mined:", receipt);
      alert("NFT comprado exitosamente. Revisa tu wallet.");

      loadMarketItems(contract);
    } catch (error) {
      console.error("Error purchasing token:", error);
      alert(
        "Error al comprar el NFT. Asegúrate de tener suficiente ETH. Error: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
    setLoading(false);
  };

  const mintInitialBatch = async () => {
    if (!contract || !signer) {
      alert("Conecta tu wallet primero");
      return;
    }

    setLoading(true);
    console.log("Minting initial batch of NFTs...");

    try {
      const items = 16;

      for (let i = 1; i < items; i++) {
        const metadataURI = `ipfs://${import.meta.env.VITE_IPFS_CID}/${i}.json`;
        const price = ethers.utils.parseEther("0.01");
        console.log(
          `Minteando y listando: ${metadataURI} por ${ethers.utils.formatEther(
            price
          )} ETH`
        );

        const transaction = await contract.mintAndList(metadataURI, price);
        console.log("Transacción enviada:", transaction);
        const receipt = await transaction.wait();
        console.log("Transacción minada:", receipt);
      }

      alert("NFTs minteados y listados exitosamente.");
      loadMarketItems(contract);
      // actualizar contador para deshabilitar nuevo batch
      try {
        const count = await contract.totalTokens();
        setTotalTokens(count.toNumber());
      } catch {}
    } catch (error) {
      console.error("Error minting initial batch:", error);
      alert(
        "Error al mintear los NFTs. Asegúrate de tener suficiente ETH. Error: " +
          (error instanceof Error ? error.message : String(error))
      );
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mercado de NFTs</h1>
        {!currentAccount ? (
          <button className="connect-btn" onClick={connectWallet}>
            Conectar Wallet
          </button>
        ) : (
          <p>
            Wallet: {currentAccount.substring(0, 6)}...
            {currentAccount.substring(currentAccount.length - 4)}
          </p>
        )}
        {contract && (
          <button
            className="refresh-btn"
            onClick={() => loadMarketItems(contract)}
            disabled={loading}
          >
            🔄 Refrescar NFTs
          </button>
        )}
        {/* Botón para mintear el batch inicial, solo para el dueño del contrato */}
        {currentAccount &&
          contractOwner &&
          currentAccount.toLowerCase() === contractOwner.toLowerCase() &&
          totalTokens === 0 && (
            <button
              onClick={mintInitialBatch}
              disabled={loading}
              className="mint-btn"
            >
              Mintear Batch Inicial (Admin)
            </button>
          )}
      </header>

      {loading && <p className="loading">Cargando...</p>}

      <h2>NFTs en Venta</h2>
      {marketplaceItems?.length === 0 && !loading && (
        <p>No hay NFTs en venta actualmente.</p>
      )}
      <div className="nft-gallery">
        {marketplaceItems?.map((item) => (
          <div key={item.tokenId} className="nft-card">
            <img
              src={
                item.image.startsWith("ipfs://")
                  ? item.image.replace("ipfs://", `${ipfsGateway}/`)
                  : item.image
              }
              alt={item.name}
              className="nft-image"
            />
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <p className="price">Precio: {item.price} ETH</p>
            <p>
              <small>
                Vendedor: {item.owner.substring(0, 6)}...
                {item.owner.substring(item.owner.length - 4)}
              </small>
            </p>
            <p>
              <small>Token ID: {item.tokenId}</small>
            </p>
            {currentAccount &&
              currentAccount.toLowerCase() !== item.owner.toLowerCase() && (
                <button
                  className="buy-btn"
                  onClick={() => purchase(item.tokenId, item.price)}
                  disabled={loading}
                >
                  Comprar
                </button>
              )}
            {currentAccount &&
              currentAccount.toLowerCase() === item.owner.toLowerCase() && (
                <p>
                  <small>(Tu NFT)</small>
                </p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
