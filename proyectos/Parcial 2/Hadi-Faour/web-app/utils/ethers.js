import { ethers } from 'ethers';

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask no está instalado");
  }

  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  });
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  return {
    account: accounts[0],
    provider,
    signer
  };
};

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("MetaMask no está instalado");
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const formatPrice = (price) => {
  return ethers.utils.formatEther(price);
};

export const parsePrice = (price) => {
  return ethers.utils.parseEther(price.toString());
};