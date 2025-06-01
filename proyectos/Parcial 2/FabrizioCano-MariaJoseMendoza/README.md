# NFT Marketplace Web APP

## Introducción

Este mini-proyecto es un mercado descentralizado de NFTs (DApp) 
donde los usuarios pueden:

- Ver las piezas en venta (mínimo 10 NFTs).
- Conectar su billetera **MetaMask**.
- Comprar un NFT y verlo inmediatamente en la sección **"NFT"** de MetaMask.

Este proyecto incluye:
- Contrato inteligente en Solidity.
- Cliente web en React con **ethers.js** para interactuar con la blockchain.

---

## Tecnologías usadas

- [Solidity](https://soliditylang.org/) (`v0.8.28`)
- [Hardhat](https://hardhat.org/)
- [React + Vite](https://vitejs.dev/)
- [ethers.js](https://docs.ethers.org/)
- [MetaMask](https://metamask.io/)
- Red local **Ephemery**

---

## Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- Node.js (v16 o superior)
- MetaMask

---
# Crear una cuenta en MetaMask
- Registrar una cuenta en MetaMask
- Configurar una red personalizada
- Ve a MetaMask > Red > Agregar red manualmente:

- Nombre de la red: Ephemery

- Nueva URL RPC: https://otter.bordel.wtf/erigon

- ID de cadena: 1337 

- Símbolo: ETH

- Para obtener fondos para pruebas ve a: ``https://ephemery-faucet.pk910.de/``, ingresa tu dirección de MetaMask y consigue fondos para desplegar contratos.
# Prueba del proyecto
## Prueba de la aplicacion desplegada

Se desplego el proyecto a la plataforma vercel, para facilitar la prueba de la app.
Ir al dominio ``https://blockchain2-p-fabrizio-canos-projects.vercel.app/`` para probar la misma.
Una vez alli conecte su billetera y puede empezar a comprar los nfts. Una vez realizada la compra puede ver su compra en la seccion NFT de su billetera metamask y en el frontend el nft comprado ya no se mostrara
### Prueba Local
- Se necesita configurar dos archivos ``.env`` . Uno en la raiz del proyecto con las siguientes variables:
```env
PRIVATE_KEY=''
VITE_CONTRACT_ADDRESS=0xDaE808688064df415bAD81d8E4EB934df1a1E0D8
VITE_RPC_URL=https://otter.bordel.wtf/erigon
VITE_METADATA_URL=QmQxiF5NpQz1equYk3hhwGyH2xnJYRuCVrKzVZuRE6xtDK
VITE_PINATA_URL=bafybeicio3wfo42ie4hwv6k2vtoazgs3us3wx36pqqev4hse66kerqo3va
```
Obs: 
1) La variable private key debe ser creada desde metamask, permite conectar la cuenta de metamask con el proyecto.
2) Se utilizo IPFS para almacenar las imagenes y los metadatos inicales y se utilizo el gateway ``gateway.pinata.cloud`` para almacenarlos en la nube.
- El segundo archivo .env debe crearse dentro de la carpeta ``web_app`` con las siguientes variables:
```env
VITE_CONTRACT_ADDRESS=0xDaE808688064df415bAD81d8E4EB934df1a1E0D8
VITE_METADATA_URL=QmQxiF5NpQz1equYk3hhwGyH2xnJYRuCVrKzVZuRE6xtDK
VITE_PINATA_URL=bafybeicio3wfo42ie4hwv6k2vtoazgs3us3wx36pqqev4hse66kerqo3va
```
### Desplegar el proyecto localmente
Ejecutar ``npm install`` tanto en la carpeta raiz como en la carpeta ``web_app``
- Compilar el proyecto: 
```js
npx hardhat compile
```
- Concetarse a metamask ejecutando en la raiz del proyecto: 
```js
npx hardhat run scripts/deploy.js --network ephemery
```
Esto arrojara una direccion de contrato que debe copiarlo en sus variables de entorno
- Copiar el archivo ``Marketplace.json`` generado en la carpeta ``atrifacts/contracts/Marketplace.sol`` a la carpeta ``abi`` dentro de ``web_app/src``
- Navegar a la carpeta ``web_app`` (``cd web_app``) y ejecutar ``npm run dev``