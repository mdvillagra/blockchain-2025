# Préstamos con garantía colateral en Ephemery

## Dependencias

Se deben instalar las dependencias tanto en el directorio raiz como en el directorio *web_app* `npm install`

## Instalación y uso
**1.** Crear un archivo .env en el directorio raiz que contenga lo siguiente:

```
PRIVATE_KEY=""//Acá se debe poner la clave privada de la billetera
VITE_RPC_URL="https://otter.bordel.wtf/erigon"
```

**2.** Desplegar el contrato: `npx hardhat run scripts/despliegue.js --network ephemery`
```
CollateralToken deployed to: 0xB6c0ea2815B54D165a851fAd960572Ced2E1E9B4
LoanToken deployed to: 0x35aceb20e931baBC78eBCD623D3d9E8c6f2C5594
LendingProtocol deployed to: 0x766DE4EbBEf8e32302208Dc706B91C574e1224f1
```

**3.** Copiar la dirección del contrato y pegarlo en la variable del archivo .env del directorio *web_app*

**4.** Ejecutar el front-end desde el directorio *web_app*: `npm run dev`

**5.** Visualizar el mercado en la dirección web que te muestre en consola
