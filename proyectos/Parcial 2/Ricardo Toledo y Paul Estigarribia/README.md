
# 🧠 Parcial 2 – Blockchain 2025

Este proyecto implementa un **mercado descentralizado de NFTs (ERC-721)** utilizando Solidity, React y Ethers.js. Los usuarios pueden visualizar NFTs, conectarse con MetaMask y comprar NFTs en la red **Ephemery Testnet**.

# 🧠 Requisitos previos
- WSL o ubuntu 22 o superior
- NodeJS 16x =>
- Metamask como extension del navegador

## 📁 Estructura del proyecto


proyecto-nft-marketplace/
├── contracts/Marketplace.sol
├── scripts/deploy.js
├── scripts/mintBatch.js
├── web_app/
│   ├── src/App.jsx
│   ├── src/components/NFTCard.jsx
├── .env
├── hardhat.config.js
├── README.md




## ⚙️ Instalación del entorno


npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install ethers dotenv
npx hardhat
# Seleccioná "Create a basic sample project"




## 🌐 Configuración de red Ephemery

En `hardhat.config.js`:

js
require('dotenv').config();

networks: {
  ephemery: {
    url: process.env.VITE_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}




## 🔐 Variables de entorno `.env`

env
PRIVATE_KEY=tu_clave_privada
VITE_CONTRACT_ADDRESS=0xTuContratoDesplegado
VITE_RPC_URL=https://localhost:8545




## 🚀 Despliegue del contrato

npx hardhat clean
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost


✅ Guardá la dirección del contrato y actualizá el archivo `.env`.



## 🎨 Minteo de NFTs iniciales

1. Subí 10 archivos `.json` con metadatos de NFTs a IPFS (por ejemplo, vía [Pinata](https://www.pinata.cloud/)).
2. Reemplazá el `baseURI` en `mintBatch.js` con tu CID.
3. Ejecutá:

 
npx hardhat run scripts/mintBatch.js --network localhost
npx hardhat run scripts/viewMyNFTs.js --network localhost



## 💻 Front-end (React + Vite)


cd web_app
npm install
npm run dev


- Se mostrará una galería de NFTs disponibles.
- Podés conectarte con MetaMask usando como clave privada la generada por el sistema y en el entorno de red localhost
- Al comprar un NFT, este aparecerá en tu sección de **coleccionables**.



## ✅ Funcionalidades implementadas

- [x] Contrato `mintAndList` y `buy()` con eventos.
- [x] Visualización de al menos 10 NFTs.
- [x] Conexión con MetaMask.
- [x] Compra directa de NFTs.
- [x] NFT visible en billetera.
- [x] Despliegue exitoso en Ephemery.
- [x] Uso eficiente de gas (`uint96`, estructura optimizada).
- [x] Código comentado, limpio, con `.env` y documentación.




## 🏁 Créditos

Desarrollado por Paul Estigarribia y Ricardo Toledo como entrega del Parcial 2 de la asignatura Blockchain.
