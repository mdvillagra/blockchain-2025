# NFT Market

Este proyecto implementa un mercado descentralizado de NFTs utilizando Solidity, Hardhat, React y Ethers.js.

# Intrucciones

- Tener una cuenta en MetaMask
- Ir a https://ephemery.dev/ y añadir network a metamask
- Asegurarse de tener fondos https://ephemery-faucet.pk910.de/#/

- Instalar las dependecias con npm install

- Cpmilar y desplegar contrato con
  npx hardhat run scripts/deploy.js --network ephemery, del cual se obtendra la direccion del contrato que debe ir en el .env

- Crear un .env en la raiz del pryecto y en web_app, el cual debe poseer lo siguiente
  PRIVATE_KEY=clave_privada
  VITE_CONTRACT_ADDRESS=direccion_contrato
  VITE_RPC_URL=https://otter.bordel.wtf/erigon

- Para el front:
  cd web_app
  npm install
  npm run dev
