const hre = require("hardhat");
require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("../artifacts/contracts/Marketplace.sol/Marketplace.json").abi;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.VITE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.VITE_CONTRACT_ADDRESS, abi, wallet);

  const uri = "https://mi-nft.com/1" // ← poné tu metadata URI o un texto cualquiera para test
  const price = ethers.utils.parseEther("0.01");

  const tx = await contract.mintAndList(uri, price);
  console.log("Minteando...");
  await tx.wait();
  console.log("NFT creado y listado correctamente.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});