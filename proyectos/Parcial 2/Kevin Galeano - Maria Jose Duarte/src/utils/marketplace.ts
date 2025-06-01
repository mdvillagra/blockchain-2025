import { Contract, BrowserProvider, formatEther, parseEther } from "ethers";
import abi from "../abi.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Conecta con el contrato usando el signer del navegador
const getContract = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, abi, signer);
};

export interface NFTItem {
  tokenId: number;
  owner: string;
  buyer: string;
  price: string;
  isSold: boolean;
  uri: string;
}

// Solicita conexión de la wallet al usuario
export async function connectWallet(): Promise<string> {
  const [address] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  return address;
}

// Obtiene todas las NFTs listadas desde el contrato
export async function getAllListings(): Promise<NFTItem[]> {
  const provider = new BrowserProvider(window.ethereum);
  const contract = new Contract(CONTRACT_ADDRESS, abi, provider);
  const items: NFTItem[] = [];

  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (code === "0x") {
    throw new Error("❌ No hay contrato en esta dirección.");
  }

  const total = await contract.tokenCounter();

  for (let i = 0; i < Number(total); i++) {
    try {
      const [owner, buyer, price, isSold] = await contract.getListing(i);
      const uri = await contract.tokenURI(i);
      items.push({
        tokenId: i,
        owner,
        buyer,
        price: formatEther(price),
        isSold,
        uri,
      });
    } catch (e) {
      console.warn(`Error cargando NFT ${i}`, e);
      continue;
    }
  }

  return items;
}

// Ejecuta la compra de un NFT
export async function purchaseNFT(tokenId: number, price: string) {
  const contract = await getContract();
  const tx = await contract.buy(tokenId, {
    value: parseEther(price),
  });
  await tx.wait();
}

// Genera un batch inicial de NFTs listados con imágenes aleatorias
export async function mintInitialBatch(count: number = 10) {
  const contract = await getContract();

  for (let i = 1; i <= count; i++) {
    const metadataURI = `ipfs://${import.meta.env.VITE_METADATA_CID}/${i}.json`;

    try {
      const tx = await contract.mintAndList(metadataURI, parseEther("0.01"));
      await tx.wait();
    } catch (err) {
      console.error(`❌ Error al mintear NFT #${i}:`, err);
    }
  }
}

// Permite al usuario retirar fondos pendientes
export async function withdrawFunds(): Promise<void> {
  const contract = await getContract();
  const tx = await contract.withdraw();
  await tx.wait();
}

// Consulta el saldo pendiente de retiro para una cuenta
export async function getPendingWithdrawal(account: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum);
  const contract = new Contract(CONTRACT_ADDRESS, abi, provider);
  const amount = await contract.pendingWithdrawals(account);
  return formatEther(amount);
}
