# 🖼️ NFT Marketplace – Proyecto Blockchain FP-UNA 2025

Este mini-proyecto es una aplicación descentralizada (DApp) que permite **listar, comprar y mintear NFTs** utilizando contratos inteligentes en Solidity y una interfaz web construida con React + Vite.

> ✅ **Contrato desplegado en Ephemery:**  
> `0x8c547442417dDd339ED6Be936CFF73e92BDd930E`

---
## 🎯 Demo en Vivo

Puedes ver y probar el proyecto en vivo aquí:

👉 [Prueba en Vivo - Parcial2](https://parcial2-murex.vercel.app/)

## ⚙️ Requisitos Previos

- Node.js (v14 o superior)
- npm
- MetaMask instalado en tu navegador

---

## 📁 Estructura del Proyecto

- `/contracts`: Contrato inteligente `Marketplace.sol`
- `/scripts`: Scripts de despliegue con Hardhat
- `/web_app`: Aplicación frontend (React + Vite)

---

## 🔐 Configuración del Entorno `.env`

### En la raíz del proyecto

Crea un archivo `.env` con:

```
VITE_RPC_URL=https://otter.bordel.wtf/erigon
VITE_CONTRACT_ADDRESS=0x8c547442417dDd339ED6Be936CFF73e92BDd930E
```

---

## 🧪 Instalación

1. Clona el repositorio.
2. Instala las dependencias:

```bash
npm install
```
> ☝️ Tanto en la raiz, como en el directorio `web_app/`

---
## 🖥️ Ejecutar la dApp

Desde el directorio `web_app/`:

```bash
npm run dev
```
O desde la raiz:

```bash
npm run start-app
```

La app estará disponible en `http://localhost:5173`.

---

## ✅ Funcionalidades

- 🔌 Conectar wallet MetaMask
- 🖼️ Ver NFTs listados (mínimo 10)
- 🛒 Comprar NFTs y recibirlos en tu wallet
- 💸 Retirar fondos acumulados
- 🎨 Mintear un lote inicial de NFTs 

---

## 🚀 Despliegue del Contrato (opcional)

Si querés desplegar tu propia versión del contrato en Ephemery:

```bash
npx hardhat run scripts/deploy.js --network ephemery
```
Agrega al archivo `.env`:
```
PRIVATE_KEY=tu_clave_privada
```

> ☝️ Solo es necesario si vas a desplegar un contrato nuevo con Hardhat.

---
> 🛠️ Si desplegas un nuevo contrato, actualiza el valor de `VITE_CONTRACT_ADDRESS` con la nueva dirección.
---




