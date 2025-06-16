import { useMarketplace } from "./hooks/useMarketplace";
import { useState } from "react";

function App() {
  const { contract } = useMarketplace();
  const [uri, setUri] = useState("");
  const [price, setPrice] = useState("");

  const mintAndList = async () => {
    if (contract && uri && price) {
      const tx = await contract.mintAndList(uri, ethers.parseEther(price));
      await tx.wait();
      alert("NFT creado y listado");
    }
  };

  return (
    <div>
      <h1>Marketplace</h1>
      <input placeholder="Token URI" value={uri} onChange={e => setUri(e.target.value)} />
      <input placeholder="Precio en ETH" value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={mintAndList}>Mintear y Listar</button>
    </div>
  );
}

export default App;
