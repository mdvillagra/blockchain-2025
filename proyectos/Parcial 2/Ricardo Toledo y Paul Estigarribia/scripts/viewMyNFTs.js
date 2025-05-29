require("dotenv").config();
const hre = require("hardhat");

const addressJSON = require("./contract-address.json"); // Ajustá si está en otro lado


async function main() {
  const contractAddress = addressJSON.contractAddress;
  const [deployer] = await hre.ethers.getSigners();
  const code = await hre.ethers.provider.getCode(contractAddress);
  console.log("Código en", contractAddress, "es:", code);


  console.log("Contrato:", contractAddress);
  console.log("Cuenta deployer:", deployer.address);

  const marketplace = await hre.ethers.getContractAt("Marketplace", contractAddress);

  try {
    const balance = await marketplace.balanceOf(deployer.address);
    console.log(`Tienes ${balance.toString()} NFT(s):`);

    // Esto solo funciona si tu contrato implementa ERC721Enumerable
    for (let i = 0; i < balance; i++) {
      const tokenId = await marketplace.tokenOfOwnerByIndex(deployer.address, i);
      const uri     = await marketplace.tokenURI(tokenId);
      console.log(`- #${tokenId.toString()} → ${uri}`);
    }
  } catch (err) {
    console.error("Error leyendo NFTs:", err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
