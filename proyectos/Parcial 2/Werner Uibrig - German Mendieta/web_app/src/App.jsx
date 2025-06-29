import { useState, useEffect } from 'react'
import { ethers, formatEther, parseEther } from 'ethers'
import MarketplaceABI from '../artifacts/contracts/Marketplace.sol/Marketplace.json'

function App() {
  const [account, setAccount] = useState(null)
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      setAccount(await signer.getAddress())
    } else {
      alert('Por favor instala Metamask')
    }
  }

  const loadNFTs = async () => {
    setLoading(true)
    setError(null)
    try {
      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        MarketplaceABI.abi,
        provider
      )
      const items = []
      let tokenId = 1
      while (true) {
        try {
          const [owner, price, isSold] = await contract.getListing(tokenId)
          if (owner === ethers.ZeroAddress) break
          const uri = await contract.tokenURI(tokenId)
          let name = '', description = '', image = ''
          try {
            const metadataUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
            const metaRes = await fetch(metadataUrl)
            if (metaRes.ok) {
              const meta = await metaRes.json()
              name = meta.name || ''
              description = meta.description || ''
              image = meta.image ? meta.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : ''
            }
          } catch {}
          items.push({
            id: tokenId,
            owner,
            price: formatEther(price),
            isSold,
            name,
            description,
            image
          })
          tokenId++
        } catch {
          break
        }
      }
      setNfts(items)
    } catch (err) {
      setError("Error al cargar los productos: " + (err?.message || err))
      setNfts([])
    }
    setLoading(false)
  }

  const purchase = async (id, price) => {
    if (!window.ethereum) {
      alert('Por favor instala Metamask')
      return
    }
    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        MarketplaceABI.abi,
        signer
      )
      const tx = await contract.buy(id, { value: parseEther(price) })
      await tx.wait()
      await loadNFTs()
    } catch (err) {
      alert("Error al comprar NFT: " + (err?.reason || err?.message || err))
    }
    setLoading(false)
  }

  useEffect(() => { loadNFTs() }, [])

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%',
        background: '#222', color: '#fff', padding: '1rem',
        display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
        zIndex: 1000, boxShadow: '0 2px 8px #0003'
      }}>
        {account ? (
          <span>Conectado: {account.slice(0, 6)}...{account.slice(-4)}</span>
        ) : (
          <button onClick={connectWallet}>Conectar Wallet</button>
        )}
      </div>
      <div style={{ paddingTop: '5rem' }}>
        <h2>Productos NFT</h2>
        {loading && <p>Cargando...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div className="grid">
          {nfts.length === 0 && !loading && <p>No hay NFTs listados para la venta.</p>}
          {nfts.map(nft => (
            <div key={nft.id} className="nft-card">
              {nft.image && (
                <img src={nft.image} alt={nft.name} style={{ width: 200, height: 200 }} />
              )}
              <h3>{nft.name}</h3>
              <p>{nft.description}</p>
              <p>Precio: {nft.price} ETH</p>
              <button
                onClick={() => purchase(nft.id, nft.price)}
                disabled={nft.isSold || loading || (account && nft.owner.toLowerCase() === account.toLowerCase())}
              >
                {nft.isSold ? 'Vendido' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default App