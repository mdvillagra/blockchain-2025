import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import MarketplaceABI from '../../artifacts/contracts/Marketplace.sol/Marketplace.json';

// Dirección del contrato desplegado en la red
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function App() {
  const [contract, setContract]             = useState(null);
  const [currentAccount, setCurrentAccount] = useState('');
  const [nfts, setNfts]                     = useState([]);
  const [total, setTotal]                   = useState(0);
  const [loading, setLoading]               = useState(false);
  const [minting, setMinting]               = useState(false);
  const [buyingId, setBuyingId]             = useState(null);

  const shorten = addr =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  useEffect(() => {
    if (!window.ethereum) {
      alert('Instala MetaMask para continuar');
      return;
    }
    window.ethereum.on('accountsChanged', accs => {
      if (accs.length === 0) clearConnection();
      else clearConnection();
    });
  }, []);

  useEffect(() => {
    if (!contract) return;
    (async () => {
      setLoading(true);
      try {
        const t = await contract.totalTokens();
        const count = Number(t);
        setTotal(count);
        await loadMarketItems(count);
      } catch (err) {
        console.error('Error loading totalTokens:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [contract]);

  /**
   * Carga los items del marketplace de forma optimizada
   * Realiza llamadas en paralelo para:
   * 1. Obtener todos los listings
   * 2. Obtener las URIs de los tokens
   * 3. Obtener los metadatos de los NFTs
   * 4. Construir el array final de items
   */
  const loadMarketItems = async count => {
    // 1) All listing calls in parallel
    const listingPromises = Array.from({ length: count }, (_, i) =>
      contract.getListing(i + 1).catch(() => null)
    );
    const listings = await Promise.all(listingPromises);

    // 2) For existing listings, all tokenURI calls in parallel
    const uriPromises = listings.map((lst, idx) => {
      if (!lst) return Promise.resolve(null);
      return contract.tokenURI(idx + 1).catch(() => null);
    });
    const uris = await Promise.all(uriPromises);

    // 3) All metadata fetches in parallel
    const metaPromises = uris.map(uri => {
      if (!uri) return Promise.resolve(null);
      if (uri.startsWith('data:application/json;base64,')) {
        const json = atob(uri.split(',')[1]);
        return Promise.resolve(JSON.parse(json));
      }
      // IPFS or HTTP
      const url = uri.startsWith('ipfs://')
        ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : uri;
      return fetch(url).then(r => r.json()).catch(() => null);
    });
    const metadatas = await Promise.all(metaPromises);

    // 4) Build items array
    const items = listings
      .map((lst, idx) => {
        if (!lst) return null;
        const [seller, rawPrice, isSold] = lst;
        const meta = metadatas[idx];
        if (!meta) return null;
        return {
          tokenId: idx + 1,
          seller,
          price: formatEther(rawPrice),
          isSold,
          name: meta.name,
          image: meta.image
        };
      })
      .filter(x => x);

    setNfts(items);
  };

  /**
   * Conecta la wallet del usuario usando MetaMask
   * Inicializa el contrato con el signer
   */
  const connectWallet = async () => {
    try {
      const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(account);
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      setContract(new Contract(CONTRACT_ADDRESS, MarketplaceABI.abi, signer));
    } catch (err) {
      console.error('Conexión fallida:', err);
    }
  };

  const clearConnection = () => {
    setCurrentAccount('');
    setContract(null);
    setNfts([]);
    setTotal(0);
  };

  /**
   * Mintea un lote inicial de 10 NFTs
   * Cada NFT tiene una imagen aleatoria de picsum.photos
   */
  const mintInitialBatch = async () => {
    if (!contract) return;
    setMinting(true);
    for (let i = 1; i <= 10; i++) {
      try {
        const meta = {
          name:  `MiNFT #${i}`,
          image: `https://picsum.photos/seed/${i}/200/200`
        };
        const uri = `data:application/json;base64,${btoa(JSON.stringify(meta))}`;
        const tx  = await contract.mintAndList(uri, parseEther('0.1'));
        await tx.wait();
        console.log(`NFT #${i} minteado correctamente`);
      } catch (err) {
        if (err.info.error.code === 4001) {
          console.log(`Mint #${i} cancelado por el usuario — deteniendo batch`);
          break;                // dejamos de pedir más firmas
        } else {
          console.error(`Error al mintear NFT #${i}:`, err);
          setMinting(false);    // limpio estado
          return;               // error no cancelación → salgo de la función
        }
      }
    }
    // Al salir del loop (sea completo o por break), recargamos
    try {
      const t = await contract.totalTokens();
      const count = Number(t);
      setTotal(count);
      await loadMarketItems(count);
    } catch (err) {
      console.error('Error actualizando lista tras mint:', err);
    } finally {
      setMinting(false);
    }
  };

  /**
   * Compra un NFT listado en el marketplace
   * Transfiere el NFT al comprador y los fondos al vendedor
   */
  const purchase = async (tokenId, price) => {
    if (!contract) return;
    setBuyingId(tokenId);
    try {
      const tx = await contract.buy(tokenId, { value: parseEther(price) });
      const receipt = await tx.wait();
      console.log("Gas usado en buy():", receipt.gasUsed.toString());
      await loadMarketItems(total);
    } catch (err) {
      if (err.info.error.code !== 4001) console.error(err); // 4001 es el código de error para un rechazo de transacción
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Marketplace NFT</h1>
      <p>Cuenta: {currentAccount || '— no conectada —'}</p>
      <div style={{ margin: '1rem 0' }}>
        {currentAccount
          ? <button onClick={clearConnection}>Desconectar</button>
          : <button onClick={connectWallet}>Conectar Wallet</button>
        }{' '}
        <button
          onClick={mintInitialBatch}
          disabled={!currentAccount || minting}
        >
          {minting ? 'Minting…' : 'Mint Inicial (x10)'}
        </button>
      </div>

      {!currentAccount
        ? <p>Conecta tu wallet para ver NFTs.</p>
        : loading
          ? <p>Cargando NFTs…</p>
          : nfts.length === 0
            ? <p>No hay NFTs.</p>
            : <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {nfts.map(nft => (
                  <div key={nft.tokenId} style={{
                    border:'1px solid #ccc',
                    borderRadius:8,
                    padding:16,
                    margin:8,
                    width:220
                  }}>
                    <img
                      src={nft.image}
                      alt={nft.name}
                      style={{ width:200, height:200, objectFit:'cover' }}
                    />
                    <h3>{nft.name}</h3>
                    <p>Precio: {nft.price} ETH</p>
                    <p style={{ fontSize:'.9rem', color:'#555' }}>
                      Vendedor: {shorten(nft.seller)}
                    </p>
                    {!nft.isSold
                      ? currentAccount.toLowerCase() !== nft.seller.toLowerCase()
                        ? <button
                            onClick={()=>purchase(nft.tokenId,nft.price)}
                            disabled={buyingId===nft.tokenId}
                          >
                            {buyingId===nft.tokenId ? 'Comprando…' : 'Comprar'}
                          </button>
                        : <p style={{ color:'orange' }}>
                            No puedes comprar tu propio NFT
                          </p>
                      : <p style={{ color:'red' }}><strong>VENDIDO</strong></p>
                    }
                  </div>
                ))}
              </div>
      }
    </div>
  );
}

export default App;
