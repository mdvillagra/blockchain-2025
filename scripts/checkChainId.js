import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const url = process.env.VITE_RPC_URL; // https://otter.bordel.wtf/erigon
  const provider = new ethers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  console.log("Ephemery chainId:", network.chainId);
}

main().catch(console.error);
