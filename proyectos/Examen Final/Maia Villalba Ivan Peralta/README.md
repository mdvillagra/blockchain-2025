## Instrucciones para conectarse a la red de MetaMask y probar la aplicación

### 1. Requisitos previos
- Tener instalado [Node.js](https://nodejs.org/)
- Tener instalada la extensión [MetaMask](https://metamask.io/) en tu navegador
- Instalar dependencias del proyecto ejecutando `npm install` en la raíz del proyecto y en `<ruta del proyecto>/web_app/vite-project`

### 2. Configuración de MetaMask para Sepolia
1. En Metamask, añada una nueva red personalizada con los siguientes valores 
   - **Nombre de la red:** Sepolia Tesnet
   - **URL RPC:** https://ethereum-sepolia-rpc.publicnode.com
   - **Chain ID:** 11155111
   - **Símbolo:** ETH
   - **URL del explorador de bloques:** https://sepolia.etherscan.io
2. Obtén ETH de prueba desde un faucet de Sepolia, por ejemplo: [https://cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

### 3. Configurar envs
1. Crear un archivo .env en la raíz del proyecto con las siguientes variables:
    - **PRIVATE_KEY** (private key de tu cuenta de metamask)
    - **VITE_CONTRACT_ADDRESS**
    - **VITE_COLLATERAL_TOKEN_ADDRESS**
    - **VITE_LOAN_TOKEN_ADDRESS**
    - **MINT_TO** (dirección de tu cuenta de metamask)

2. Crear un archivo .env en `<ruta del proyecto>/web_app/vite-project` con las siguientes variables:
    - **VITE_CONTRACT_ADDRESS**
    - **VITE_COLLATERAL_TOKEN_ADDRESS**
    - **VITE_LOAN_TOKEN_ADDRESS**

3. Desplegar los tokens en la red Sepolia:

```bash
npx hardhat run scripts/deployTokens.js --network sepolia
```

4. Copiar las direcciones que aparecen luego de `CollateralToken deployed at:` y `LoanToken deployed at:` y pegar en sus correspondientes variables en ambos envs

5. Desplegar el contrato principal: 
```bash
npx hardhat run scripts/deployLending.js --network sepolia
```

6. Copiar la dirección que aparece luego de `LendingProtocol deployed at:` y pegar en `VITE_CONTRACT_ADDRESS` en ambos envs

7. Minta tokens para las pruebas:

```bash
npx hardhat run scripts/mintTokens.js --network sepolia
```


### 4. Probar la aplicación web
1. Ve a la carpeta de la aplicación web:

```bash
cd web_app/vite-project
```

2. Inicia la aplicación:

```bash
npm run dev
```

### 5. Tests y Coverage

1. Para realizar los tests:
```bash
npx hardhat test
```

2. Para verificar el coverage:
```bash
npx hardhat coverage
```
