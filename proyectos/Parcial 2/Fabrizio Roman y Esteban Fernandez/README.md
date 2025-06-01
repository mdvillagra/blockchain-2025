# Marketplace NFT - Segundo Parcial Blockchain

### Integrantes
- Fabrizio Roman
- Esteban Fernandez

### Descripción
Este proyecto implementa un marketplace de NFTs donde los usuarios pueden:
- Conectar su billetera MetaMask
- Mintear NFTs
- Comprar NFTs y verlos en sus coleccionables

### Tecnologías Utilizadas
- Solidity 0.8.28
- React + Vite
- Ethers.js
- Hardhat
- MetaMask

### Requisitos Previos
- Node.js (v16 o superior)
- MetaMask instalado en el navegador
- Cuenta en Ephemery con fondos

### Instalación

1. **Instalar dependencias en la raiz del proyecto**
```bash
npm install
```

2. **Instalar dependencias en web app**
```bash
cd web_app
npm install
```

### Variables de entorno

Crear un archivo `.env` en la raiz del proyecto con el siguiente contenido:
```
# Clave privada de tu cuenta
PRIVATE_KEY="tu_clave_privada_aquí"

# URL del RPC para Ephemery
VITE_RPC_URL=https://otter.bordel.wtf/erigon

# Dirección del contrato
VITE_CONTRACT_ADDRESS=0x0f5D1ef48f12b6f691401bfe88c2037c690a6afe
```

### Despliegue

**Compilar contratos**
```bash
npx hardhat compile
```
o puedes desplegar otro contrato con tu cuenta:
```bash
npx hardhat run scripts/deploy.js --network ephemery
```
y copiar la dirección resultante en `VITE_CONTRACT_ADDRESS` del `.env`

### MetaMask & Ephemery Testnet

   1. Abre MetaMask y ve a **Redes → Añadir una red personalizada**.  
   2. Rellena los campos con estos datos:  
      - **Nombre de la red**: `Ephemery Testnet`  
      - **URL de RPC**: `https://otter.bordel.wtf/erigon`
      - **ID de cadena**: `39438146`
      - **Símbolo de moneda**: `ETH`  
   3. Guarda la red y cámbiate a Ephemery Testnet.

### Obtener fondos para la red Ephemery Testnet
Para desplegar tus contratos en Ephemery Testnet necesitarás ETH de prueba. Sigue estos pasos:
1. Abre la faucet `https://ephemery-faucet.pk910.de/` en tu navegador.

2. Ingresa tu dirección de tu cuenta de MetaMask y consigue fondos

### Ejecutar la Aplicación

```bash
cd web_app
npm run dev
```

### Funcionalidades Principales

- Conecta MetaMask al frontend (botón Conectar Wallet).
- Haz Mint Inicial (x10) para crear y listar tus primeros 10 NFTs.
- Explora los NFTs listados:
  - Verás imagen, nombre, precio en ETH y vendedor.
  - Compra con Comprar; la UI se actualiza automáticamente.
- Después de la compra, abre MetaMask en “NFTs” para ver tu nuevo NFT.