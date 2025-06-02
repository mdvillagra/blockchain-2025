const hre = require("hardhat");

// URLs de ejemplo para los NFTs iniciales (deberías reemplazarlas con tus propias imágenes/metadatos)
const INITIAL_NFTS = [
  {
    uri: "ipfs://QmXxRZjtJzXjJ1kUZ5Jg5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5",
    price: hre.ethers.utils.parseEther("0.01")
  },
  {
    uri: "ipfs://QmYyRZjtJzXjJ1kUZ5Jg5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v6",
    price: hre.ethers.utils.parseEther("0.02")
  },
  // Agrega más NFTs según sea necesario...
];

async function main() {
  // Obtenemos el contrato desplegado
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.attach(contractAddress);
  
  // Preparamos los datos para el lote inicial
  const tokenURIs = INITIAL_NFTS.map(nft => nft.uri);
  const prices = INITIAL_NFTS.map(nft => nft.price);
  
  // Minteamos el lote inicial
  const tx = await marketplace.mintInitialBatch(tokenURIs, prices);
  await tx.wait();
  
  console.log("Lote inicial de NFTs minteado exitosamente");
  
  // Verificamos el total de NFTs
  const total = await marketplace.totalSupply();
  console.log(`Total de NFTs minteados: ${total}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });