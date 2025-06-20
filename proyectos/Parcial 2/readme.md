# NFT Marketplace - Trabajo Práctico Blockchain (Parcial 2)

Este proyecto es una DApp (Aplicación Descentralizada) desarrollada como parte del Trabajo Práctico de la materia Blockchain, correspondiente al Parcial 2 de la carrera Ingeniería Informática. El objetivo es implementar un marketplace de NFTs (tokens ERC-721) que permita a los usuarios mintear, listar y comprar NFTs, utilizando tecnologías modernas como Solidity, React, Vite, ethers.js y MetaMask.

---

## 📌 Requisitos del trabajo

- ✅ Contrato inteligente en Solidity (ERC-721)
- ✅ Frontend con React y Vite
- ✅ Conexión vía ethers.js
- ✅ Uso de MetaMask y despliegue en una testnet (Sepolia)
- ✅ Código documentado y funcional

---

## ⚙️ Tecnologías utilizadas

- Solidity `^0.8.20`
- Hardhat
- OpenZeppelin Contracts
- ethers.js `^5.7.2`
- React 18 + Vite
- MetaMask
- Testnet: Sepolia (por razones prácticas en lugar de Ephemery)

---

## 🧠 Estructura del proyecto

nft-marketplate/
├── contracts/
│ └── Marketplace.sol
├── scripts/
│ └── deploy.js
├── frontend/
│ ├── src/
│ │ └── App.jsx
│ ├── index.html
│ └── ...
├── hardhat.config.js
├── .env
├── package.json
└── README.md


---

## 📜 Descripción del contrato (`Marketplace.sol`)

- Hereda de `ERC721URIStorage` y `Ownable`
- Permite a los usuarios:
  - Mintear NFTs con metadata y precio
  - Listarlos para la venta
  - Comprarlos directamente
- Incluye un `listingFee` de 0.01 ETH para evitar spam

---

## 🌐 Frontend

- Desarrollado con React y Vite
- Carga automáticamente los NFTs listados
- Interactúa con el contrato vía ethers.js
- Compatible con MetaMask para firmar transacciones

---

## 🚀 Despliegue

> ⚠️ *No se pudo completar el despliegue en testnet debido a que los faucets de Sepolia requerían saldo previo en mainnet o estaban fuera de servicio.*

**Acción alternativa:** Se dejó preparado el script `scripts/deploy.js` y el contrato está listo para ser desplegado cuando se disponga de ETH de testnet.

---

## 📦 Instalación y ejecución local

### 1. Backend (contratos)

```bash
cd nft-marketplate
npm install
npx hardhat compile
# Para desplegar (una vez con ETH de Sepolia):
npx hardhat run scripts/deploy.js --network sepolia

