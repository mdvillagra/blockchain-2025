# Despliegue Completo del Sistema de Préstamos (Lending DApp)

Este documento guía el proceso para instalar, configurar y desplegar desde cero un sistema descentralizado de préstamos, incluyendo contratos inteligentes y la interfaz web.

---

## ✅ Requisitos Previos

### 🧰 Herramientas Necesarias

- **Node.js** (versión 18+)
  ```bash
  node --version
  npm --version
  ```
- **Git**
  ```bash
  git --version
  ```
- **Extensión MetaMask** (instalar desde [metamask.io](https://metamask.io/))

### 🧠 Conocimientos Sugeridos

- Terminal básica (CLI)
- Conceptos fundamentales de Ethereum y contratos inteligentes
- Fundamentos de React.js y JavaScript

---

## ⚙️ Instalación Inicial

### 1. Clonación del Proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd blockchain-final/lending-dapp
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Variables de Entorno

Crear `.env` y agregar:

```env
PRIVATE_KEY=tu_clave_privada
RPC_URL=https://sepolia.infura.io/v3/TU_PROJECT_ID
```

---

## ⚒️ Configuración

### `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: { chainId: 1337 },
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

---

## 📦 Contratos Inteligentes

### Compilación y Pruebas

```bash
npx hardhat compile
npm test
```

### Despliegue Local

```bash
npx hardhat node
# En otra terminal
npx hardhat run scripts/deploy.js --network localhost
```

### Despliegue a Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Verificación (Opcional)

```bash
npx hardhat verify --network sepolia <DIRECCION_CONTRATO>
```

---

## 🌍 Interfaz Web

### Preparación

```bash
cd web_app
npm install
```

Editar `src/contractABI.json` con direcciones de contratos.

### Ejecutar en Desarrollo

```bash
npm run dev
```

Abrir en `http://localhost:5173`.

### Producción

```bash
npm run build
```

Subir `dist/` a Netlify, Vercel u otro.

---

## 🧪 Configuración y Pruebas

```bash
npx hardhat run scripts/setup-tokens.js --network sepolia
```

Probar funcionalidades desde la interfaz conectando MetaMask.

---

## 🧰 Scripts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```



