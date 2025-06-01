## Instalar dependencias

Ejecutar `npm install` en la raíz del proyecto y en `<ruta del proyecto>/web_app/vite-project`

## Configurar Metamask

En Metamask, añada una nueva red personalizada con los siguientes valores 

Nombre de la red: ephemery-testnet

URL RPC por defecto: otter.bordel.wtf/erigon

Identificador de cadena: 39438146

Símbolo de moneda: ETH


## Crear .env

Crear un archivo .env en la raíz del proyecto con la variable `PRIVATE_KEY`, la cual debe almacenar la clave privada de la cuenta de metamask

Crear un archivo .env en `<ruta del proyecto>/web_app/vite-project` con la variable `VITE_CONTRACT_ADDRESS`, la cual debe almacenar la dirección del contrato

dirección en la cual ya hay 10 nfts disponibles -> `0xd9620B06f53c4Ede05009B2319D7B6630679950b`

Para obtener una nueva dirección, en la raíz del proyecto, ejecute `npx hardhat run scripts/deploy.js --network ephemery` y copie la dirección que este luego de `MarketplaceNFT deployed to:`

## Correr el proyecto

En `<ruta del proyecto>/web_app/vite-project`, ejecutar `npm run dev`