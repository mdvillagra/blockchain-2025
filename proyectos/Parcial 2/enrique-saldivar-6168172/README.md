# Mercado Descentralizado de NFTs

Este proyecto implementa un mercado descentralizado de NFTs (DApp) donde los usuarios pueden:

1. Ver NFTs en venta
2. Conectar su billetera MetaMask
3. Comprar NFTs y verlos en sus coleccionables

## Estructura del Proyecto

- `backend/`: Contratos inteligentes y configuración de Hardhat
- `frontend/`: Aplicación web con React y Vite

## Tecnologías Utilizadas

- Solidity 0.8.28
- Hardhat
- React + Vite
- Ethers.js v5.7
- MetaMask

## Requisitos Previos

- Node.js (v16+)
- npm o pnpm
- MetaMask instalado en el navegador
- Cuenta con fondos en la red Ephemery Testnet

## Ejecución

```
cd frontend
cp .env.example .env
pnpm install
pnpm run dev
```

## Uso de la Aplicación

1. **Conectar Wallet**: Haz clic en "Conectar Wallet" para vincular tu cuenta de MetaMask.
2. **Mintear NFTs Iniciales**: El propietario del contrato puede mintear un lote inicial de NFTs haciendo clic en "Mintear Batch Inicial".
3. **Visualizar NFTs**: Los NFTs disponibles aparecerán en tarjetas con su información y precio.
4. **Comprar NFT**: Haz clic en "Comprar" en cualquier NFT disponible y confirma la transacción en MetaMask.
5. **Ver en MetaMask**: Después de la compra, el NFT aparecerá automáticamente en la sección "NFTs" de tu billetera MetaMask.

## Dirección de Contrato Desplegado

Contrato Marketplace desplegado en Ephemery Testnet:
`0xfBb2902bd3C4A73F72FCc81439646dbe45D1d0AD`
