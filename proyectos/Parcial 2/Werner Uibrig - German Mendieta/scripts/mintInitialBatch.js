require("dotenv").config();
const hre = require("hardhat");

const uris = [
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/1.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/2.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/3.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/4.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/5.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/6.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/7.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/8.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/9.json",
    "https://gateway.pinata.cloud/ipfs/bafybeieqppjkoujqghysysvxjw4uu4nka2aakb4fc2cpmn67mk2zz2cdqu/10.json"
];

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const { ethers } = hre;
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS; // Lee del .env
  const abi = require("../artifacts/contracts/Marketplace.sol/Marketplace.json").abi;
  const contract = new ethers.Contract(contractAddress, abi, owner);

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    const price = ethers.parseEther("0.01");
    const tx = await contract.mintAndList(uri, price);
    await tx.wait();
    console.log("Minted NFT", i + 1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});