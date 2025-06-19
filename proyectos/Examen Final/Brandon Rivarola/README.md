# Préstamos con garantía colateral en Ephemery

## Dependencias

Se deben instalar las dependencias tanto en el directorio raiz como en el directorio *web_app* `npm install`

## Instalación y uso
**1.** Crear un archivo .env en el directorio raiz que contenga lo siguiente:

```
PRIVATE_KEY=""//Acá se debe poner la clave privada de la billetera
VITE_RPC_URL="https://otter.bordel.wtf/erigon"
```

**2.** Ejecutar las pruebas: `npm run coverage`

**3.** Se deben desplegar los contratos, ya que al hacerlo se deben acuñar los fondos de préstamos para el protocolo y los fondos de colaterales para la billetera: `npx hardhat run scripts/deploy.js --network ephemery`

**4.** Copiar las direcciones de los contratos, crear un archivo .env en el directorio *web_app* y agregar las direcciones en el mismo:
```
VITE_LENDING_PROTOCOL_ADDRESS=""//La dirección del protocolo
VITE_LOAN_TOKEN_ADDRESS=""//La dirección del préstamo
VITE_COLLATERAL_TOKEN_ADDRESS=""//La dirección del colateral
```

**5.** Ejecutar el front-end desde el directorio *web_app*: `npm run dev`

**6.** Visualizar y probar la página en la dirección web que te muestre en consola
