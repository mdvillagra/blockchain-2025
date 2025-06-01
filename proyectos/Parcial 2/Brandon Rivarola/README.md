# Mercado descentralizado en Ephemery

## Dependencias

Se deben instalar las dependencias tanto en el directorio raiz como en el directorio *web_app* `npm install`

## Instalación y uso
**1.** Modificar el archivo .env del directorio raiz y colocar la clave privada de la billetera

**2.** Desplegar el contrato: `npx hardhat run scripts/despliegue.js --network ephemery`


**3.** Copiar la dirección del contrato y pegarlo en la variable del archivo .env del directorio *web_app*

**4.** Ejecutar el front-end desde el directorio *web_app*: `npm run dev`

**5.** Visualizar el mercado en la dirección web que te muestre en consola
