# 🛒 NFT Marketplace

Este proyecto es una aplicación completa de un Marketplace NFT basada en Ethereum. Permite crear, listar, visualizar, comprar y retirar fondos por NFTs en la blockchain.

> 🔗 Desarrollado con **Solidity, Hardhat, React, TypeScript, Vite y Ethers.js**.

---

## 🌐 Deployment en Producción

El proyecto ya está desplegado y funcionando en:

👉 https://kevinmajo-blockchain.vercel.app/  
Puedes probar directamente la aplicación Web3 en esa URL, mintear, comprar y retirar NFTs con MetaMask. 🚀

✅ El contrato inteligente fue desplegado exitosamente en la testnet Ephemery con la siguiente dirección:
```0xf1aE26e9E03B17Bf1603c8e4665687a3Cc0b1C09```

Puedes explorarlo aquí:
👉 https://otter.bordel.wtf/address/0xf1aE26e9E03B17Bf1603c8e4665687a3Cc0b1C09

---

## 📌 Funcionalidades

- 🚀 Deploy automático del contrato inteligente `Marketplace`.
- 🧙‍♂️ Mint de NFTs con metadata válida alojada en IPFS (compatible con MetaMask y OpenSea).
- 🖼 Visualización dinámica de imágenes desde el campo `image` en el JSON de metadata.
- 🛍 Visualización por pestañas: NFTs en tienda, minteados, vendidos y comprados.
- 👛 Integración con wallets (como MetaMask).
- 🛒 Compra segura de NFTs usando ETH.
- 🏦 Retiro de fondos para los vendedores.
- 🔥 UI moderna con `React`, `Toastify`, `Icons` y diseño responsivo.

---

## 📦 Estructura del Proyecto

```bash
nft-marketplace/
├── contracts/ # Contratos inteligentes (Solidity)
│ └── Marketplace.sol
├── scripts/ # Scripts Hardhat para deploy y chequeo
│ ├── deploy.ts
│ └── check-tokenCounter.ts
├── src/ # Frontend con React + Vite + TypeScript
│ ├── App.tsx
│ ├── utils/marketplace.ts # Funciones Web3
│ ├── components/ # Componentes UI
│ ├── abi.json # ABI del contrato
│ ├── index.css, App.css # Estilos generales
├── hardhat.config.ts # Configuración Hardhat
├── package.json # Dependencias y scripts
├── vite.config.ts # Configuración de Vite
├── README.md # Este archivo
└── .env # Variables como VITE_CONTRACT_ADDRESS
```

## ⚙️ Instalación y Setup

Clona el repositorio:

```bash
git clone https://github.com/gsmkev/gsmkev-blockchain-assignments-fpuna.git
cd gsmkev-blockchain-assignments-fpuna
```

Selecciona la rama tp2:

```bash
git checkout tp2
```

Instala dependencias (usando `--legacy-peer-deps` para compatibilidad con ethers v6):

```bash
npm install --legacy-peer-deps
```

Configura el archivo .env con tus credenciales:

```bash
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_RPC_URL=https://your-eth-node-url
PRIVATE_KEY=tu_clave_privada
VITE_NFT_CID=el_cid_de_tus_imagenes
VITE_METADATA_CID=el_cid_de_los_jsons
```

## 🧠 Contrato Inteligente

El contrato Marketplace.sol está escrito en Solidity ^0.8.28 e implementa:

- 🎨 `mintAndList(uri, price)` → Mintea y lista NFTs.
- 💸 `buy(tokenId)` → Permite comprar un NFT pagando en ETH.
- 🏧 `withdraw()` → El vendedor puede retirar su saldo acumulado.
- 📦 `getListing(tokenId)` → Devuelve los datos de la venta de un NFT.

Todos los NFTs cumplen el estándar ERC721 usando OpenZeppelin.

## 🖼 Frontend React + IPFS

Incluye una interfaz que:

- Conecta con MetaMask.
- Permite mintear NFTs con imágenes en formato .webp alojadas en IPFS.
- Extrae dinámicamente el campo image desde el tokenURI para mostrar la imagen real del NFT.

## 🧪 Scripts útiles

Desplegar contrato:

```bash
npx hardhat run scripts/deploy.ts --network ephemery
```

Ver el contador de tokens:

```bash
npx hardhat run scripts/check-tokenCounter.ts --network ephemery
```

Generar el json con los metadatos

```bash
node generateMetadata.js
```

## 🛠 Funciones Web3 implementadas (marketplace.ts)

- `connectWallet()` → Conecta MetaMask.
- `getAllListings()` → Carga todos los NFTs listados.
- `purchaseNFT(tokenId, price)` → Compra un NFT.
- `withdrawFunds()` → Retira el saldo de un vendedor.
- `mintInitialBatch()` → Mintea NFTs usando URIs a metadatos JSON en IPFS.
- `getPendingWithdrawal(account)` → Verifica cuánto tiene un vendedor por retirar.

## 🔧 Herramientas y Librerías

- `Hardhat`: Testing, deploy y compilación de contratos.
- `OpenZeppelin Contracts`: Seguridad y estándares ERC.
- `ethers.js`: Conexión blockchain desde frontend.
- `React + Vite`: Interfaz web moderna.
- `TypeScript`: Tipado estricto.
- `react-toastify, react-icons`: UI y notificaciones.

## 🧩 IPFS y Metadata

Este proyecto usa IPFS como sistema de almacenamiento para los NFTs:

- Las imágenes .webp se alojan bajo un CID global compartido.
- Los archivos .json con metadata se generan con rutas como:

```bash
{
"name": "NFT #1",
"description": "NFT con imagen alojada en IPFS",
"image": "ipfs://<cid>/1.webp"
}
```

Al mintear, se usa `ipfs://<cid>/1.json` como tokenURI.

La interfaz extrae automáticamente el image desde el JSON y lo muestra en pantalla.

## ✅ Compatibilidad

- Compatible con MetaMask, wallets EVM y marketplaces como OpenSea.
- Compatible con archivos .webp y metadatos IPFS validados.
