# NFT Market

Este proyecto implementa un mercado descentralizado de NFTs utilizando Solidity, Hardhat, React y Ethers.js.

# CONTRATO

Contrato Desplegado

Red: Ephemery Testnet
Dirección del Contrato: 0xbF2A94cba414cadA815224466A661fd956Ed0A43
Explorer: https://explorer.ephemery.dev/address/0xbF2A94cba414cadA815224466A661fd956Ed0A43

# Intrucciones

- Tener una cuenta en MetaMask
- Ir a https://ephemery.dev/ y añadir network a metamask
- Asegurarse de tener fondos https://ephemery-faucet.pk910.de/#/

- Instalar las dependecias con npm install

- Crear un .env en la raiz del pryecto y en web_app, el cual debe poseer lo siguiente
  PRIVATE_KEY=clave_privada
  VITE_CONTRACT_ADDRESS=0xbF2A94cba414cadA815224466A661fd956Ed0A43
  VITE_RPC_URL=https://otter.bordel.wtf/erigon

- Para el front:
  cd web_app
  npm install
  npm run dev
