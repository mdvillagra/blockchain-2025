# 🖼️ NFT Marketplace - Parcial 2 Blockchain

Marketplace descentralizado de NFTs desarrollado como parte del Parcial 2 de la asignatura *Blockchain* en la FP-UNA. Permite conectar billeteras Web3, acuñar y vender NFTs, y realizar compras con ETH en la red de prueba **Ephemery**.

---

## Objetivos

- Crear y administrar NFTs ERC-721 usando Solidity.
- Interactuar con contratos mediante `ethers.js` y `MetaMask`.
- Visualizar NFTs en billetera después de comprarlos.

---

## Características Principales

- Conexión con MetaMask
- Exploración y compra de NFTs
- Acuñar (mint) y listar NFTs en el marketplace
- Visualización en grilla
- Notificaciones interactivas (toast)
- Integración con red de prueba Ephemery

---

## 🛠️ Tecnologías Usadas

### Frontend
- **React 19**, **Vite**
- **Tailwind CSS**, **DaisyUI**
- **ethers.js**
- **react-hot-toast**
- **Lucide React**

### Backend / Blockchain
- **Solidity** con **OpenZeppelin**
- **Hardhat** (con configuración para Ephemery)
- **IPFS** para metadatos de NFTs

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js v18+
- MetaMask instalada
- ETH de prueba (obtenido de faucet)
- Variables de entorno:

---

## 🧭 ¿Cómo funciona el Frontend?

Una vez que hayas iniciado la aplicación (`npm run dev`), podés abrir tu navegador en `http://127.0.0.1:5173`. La aplicación tiene las siguientes funcionalidades principales:

### 🔐 Conexión con MetaMask
- La conexión con MetaMask **no es automática**.
- El usuario debe hacer clic en el botón **"Conectar billetera"** para iniciar sesión.
- Solo después de conectarse, se puede comprar y crear NFTs.

### 🏪 Marketplace
- Muestra todos los NFTs actualmente listados.
- Cada NFT incluye:
  - Imagen
  - Título
  - Precio en ETH
- Los botones de **"Comprar"** solo aparecen si la billetera está conectada.
- Al hacer clic en **"Comprar"**, se abre MetaMask para confirmar la transacción.
- Una vez aprobada, el NFT se transfiere al comprador.


### ⚙️ Crear NFTs Automáticamente
- Hay un botón para **crear 10 NFTs de forma automática**.
- Cada NFT se acuña y se lista uno por uno.
- Para cada NFT, se abre MetaMask y se requiere confirmar la transacción manualmente.


### Instalación

**Instalar dependencias del frontend**
```bash
cd frontend
npm install
```

**Iniciar el servidor de desarrollo**
```bash
npm run dev
```

**Instalar dependencias del backend**
```bash
cd backend
npm install
```

**Compilar contratos**
```bash
cd backend
npx hardhat compile
```

# Ejecutar tests
```bash
cd backend
npx hardhat test test/Marketplace.js
```
npx hardhat test

# Desplegar en red de prueba
```bash
npx hardhat run scripts/deploy.js --network ephemery
```

## ⚙️ Variables de Entorno

## Frontend
VITE_CONTRACT_ADDRESS=0x54bA0676f9E554c6072967d89D0f848cDaD2F394
VITE_RPC_URL=https://otter.bordel.wtf/erigon

## Backend
PRIVATE_KEY=tu_clave_privada
RPC_URL=https://otter.bordel.wtf/erigon


