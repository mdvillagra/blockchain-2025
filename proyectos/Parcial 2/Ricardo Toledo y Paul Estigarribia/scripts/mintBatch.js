// scripts/mintBatch.js
require("dotenv").config();
const hre = require("hardhat");

const addressJSON = require('./contract-address.json');

async function main() {
  
  const contractAddress = addressJSON.contractAddress;
  if (!contractAddress) throw new Error("VITE_CONTRACT_ADDRESS no está definido en .env");

  const Marketplace = await hre.ethers.getContractAt("Marketplace", contractAddress);

  const totalNFTs = 10;
  const baseURI = "https://gateway.pinata.cloud/ipfs/QmX92AbCdEfGh12345678ijklmnopQRSTuv";// Cambiar por tu CID real

  for (let i = 1; i <= totalNFTs; i++) {
    const uri = `${baseURI}/${i}.json`;

    const price = hre.ethers.parseEther((0.01 * i).toFixed(2));
    console.log(`Creando NFT ${i} con URI: ${uri} y precio: ${price.toString()}`);


    const tx = await Marketplace.mintAndList(uri, price);
    await tx.wait();
    console.log(`✅ NFT ${i} mintado y listado correctamente.`);

  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error minting:", err);
    process.exit(1);
  });

  //const [deployer] = await ethers.getSigners();(deployer.address)(await deployer.provider.getBalance(deployer.address)).toString()