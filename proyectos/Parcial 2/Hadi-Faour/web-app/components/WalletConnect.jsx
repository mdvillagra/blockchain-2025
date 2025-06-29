import React, { useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnect = ({ account, connectWallet, setContract }) => {
  // Dirección del contrato desde las variables de entorno
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_RPC_URL;
  
  // Cargar el contrato cuando la cuenta cambie
  useEffect(() => {
    const loadContract = async () => {
      if (!account || !contractAddress) return;
      
      try {
        // Configurar el provider y el signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // ABI del contrato (simplificada para este ejemplo)
        const abi = [
          "function totalSupply() view returns (uint256)",
          "function getListing(uint256 tokenId) view returns (address owner, uint96 price, bool isSold, string memory tokenURI)",
          "function buy(uint256 tokenId) payable",
          "event ItemListed(uint256 indexed tokenId, address owner, uint96 price, string tokenURI)",
          "event ItemSold(uint256 indexed tokenId, address buyer, uint96 price)"
        ];
        
        // Crear instancia del contrato
        const contract = new ethers.Contract(contractAddress, abi, signer);
        setContract(contract);
      } catch (error) {
        console.error("Error cargando contrato:", error);
      }
    };
    
    loadContract();
  }, [account, contractAddress, setContract]);
  
  return (
    <div className="wallet-connect">
      {account ? (
        <p>Conectado como: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
      ) : (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      )}
    </div>
  );
};

export default WalletConnect;