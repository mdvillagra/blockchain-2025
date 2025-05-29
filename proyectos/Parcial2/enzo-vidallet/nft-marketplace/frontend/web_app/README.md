# NFT Marketplace - Documentación del Proyecto

## 📌 Descripción

Este proyecto es un mercado descentralizado de NFTs (ERC-721) construido con:
- **Frontend**: React + Vite + ethers.js
- **Blockchain**: Solidity + Hardhat
- **Red**: Localhost (Hardhat Network) / Ephemery Testnet

## 🚀 Instalación y Ejecución

### Requisitos previos
- Node.js (v16+)
- MetaMask instalado en tu navegador
- Hardhat (incluido en las dependencias)

### 1. Configuración inicial

```bash
# Clonar el repositorio (si aplica)
git clone [tu-repositorio]
cd nft-marketplace

# Instalar dependencias
cd backend && npm install
cd ../frontend/web_app && npm install
```

### 2. Iniciar entorno de desarrollo

**Terminal 1 - Blockchain local:**
```bash
cd backend
npx hardhat node
```

**Terminal 2 - Desplegar contrato:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Terminal 3 - Frontend:**
```bash
cd frontend/web_app
npm run dev
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` en `/backend`:
```
PRIVATE_KEY=tu_clave_privada_de_cuenta_de_prueba
```

Y en `/frontend/web_app`:
```
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_RPC_URL=http://localhost:8545
```

## 🛠️ Funcionalidades Principales

### Contrato Inteligente (`NFTMarketplace.sol`)
- `mintAndList`: Crear y listar nuevos NFTs
- `buy`: Comprar NFTs listados
- `getListing`: Consultar información de NFTs
- `withdraw`: Retirar fondos acumulados

### Frontend
- Conexión con MetaMask
- Visualización de NFTs disponibles
- Mint de NFTs de prueba (10 iniciales)
- Compra/venta de NFTs

## 📂 Estructura de Archivos

```
/nft-marketplace
  /backend
    contracts/           # Contratos inteligentes
    scripts/            # Scripts de despliegue
    hardhat.config.js   # Configuración de Hardhat
  /frontend
    web_app/
      src/
        contracts/      # ABI y direcciones
        components/     # Componentes React
        App.jsx        # Componente principal
      public/          # Assets estáticos
```

## 🧪 Testing

Para ejecutar pruebas del contrato:
```bash
cd backend
npx hardhat test
```

## 🌐 Despliegue en Testnet (Ephemery)

1. Configura tu `hardhat.config.js` con:
```javascript
networks: {
  ephemery: {
    url: "https://rpc.ephemery.dev",
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

2. Desplegar:
```bash
npx hardhat run scripts/deploy.js --network ephemery
```