# NexusLend

Aplicación de préstamos descentralizados construida con Solidity, Hardhat y React.

---

## 📦 Dependencias clave

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity 0.8.28
- **Development Framework**: Hardhat
- **Frontend**: React + Vite
- **Web3 Library**: Ethers.js v6
- **Testing**: Hardhat + Chai
- **Wallet Integration**: MetaMask

### Frontend
- `react`, `next`, `ethers`: Interfaz de usuario y conexión con blockchain
- `tailwindcss`, `lucide-react`, `radix-ui`: Estilos y componentes visuales
- `dotenv`: Configuración vía .env

### Backend / Smart Contracts
- `hardhat`, `solidity-coverage`, `chai`, `mocha`: Desarrollo y testing de contratos
- `@openzeppelin/contracts`: Base de los contratos ERC20
- `@nomicfoundation/*`: Plugins Hardhat (verify, chai matchers, etc.)

## 📊 Backend (Contratos + Tests)

### Contratos principales

* `CollateralToken.sol`: Token ERC20 (cUSD) usado como colateral.
* `LoanToken.sol`: Token ERC20 (dDAI) entregado como préstamo.
* `LendingProtocol.sol`: Lógica del protocolo de préstamos, depósitos, retiros y repagos.

### Scripts

* `scripts/deploy.js`: Despliega los contratos a la red (Sepolia o local).
* `scripts/setMinter.js`: Autoriza al protocolo como minter de dDAI y mintea tokens al deployer.
*  `scripts/mint.js`: Permite mintear cUSD y dDAI directamente desde consola al deployer.

## 🔄 Flujo para usar 

1. Desplegá los contratos:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

2. Autorizá al protocolo como minter y minteate tokens:

```bash
npx hardhat run scripts/setMinter.js --network sepolia
```

3. Mintea cUSD y dDAI directamente desde consola al deployer

```bash
npx hardhat run scripts/mint.js --network sepolia
```

### Configuración de entorno
### IMPORTANTE!!!: Antes de correr cualquier script o test, asegurate de tener configurado el archivo .env en la raíz del proyecto. Podés usar estas direcciones si estás apuntando a los contratos ya desplegados en Sepolia, si desplegas uno nuevo con scripts/deploy.js debes de copiarlo y pegarlo en direcciones de contratos en sepolia dentro de tu .env creado en la raiz del proyecto(reemplazar esos que estan abajo):

```env
PRIVATE_KEY=tu_clave_privada_sin_comillas
ETHERSCAN_API_KEY=tu_api_key_de_etherscan
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/tu_api_key_de_alchemy

# Direcciones de contratos en Sepolia (ya desplegados)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3de5380316031727D258a8F99F730A7D536886e1
NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=0x5fc3Eb88EbF29eB38Bb22DB8FF7097a1d8901201
NEXT_PUBLIC_LOAN_TOKEN_ADDRESS=0x372Ca81A22bA121dB691FDB69648Fe61145a399F

```

### Dónde se utilizan las variables del .env?

- PRIVATE_KEY: Se usa en hardhat.config.js para desplegar contratos y firmar transacciones con esa cuenta.

* accounts: [process.env.PRIVATE_KEY],

- ETHERSCAN_API_KEY: Se usa para verificar contratos en Etherscan usando el plugin de verificación.

* etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY,
},

- VITE_RPC_URL: Se usa para conectarse a la red Sepolia a través de Alchemy u otro nodo RPC.

* epolia: {
  url: process.env.VITE_RPC_URL,
  accounts: [process.env.PRIVATE_KEY]
}


### Comandos para test y cobertura

```bash
npx hardhat test          # Ejecuta todos los tests unitarios
npm run coverage          # Ejecuta pruebas con reporte de cobertura
```

Todos los contratos alcanzan **100% de cobertura**, incluyendo casos de error (reverts, fails, límites de colateral, etc).

### 📊 Test Results

```
✔ 20 passing tests
✔ 100% line coverage
✔ All edge cases covered
✔ Security patterns implemented

Results:

20 passing (13s)

----------------------|----------|----------|----------|----------|----------------|
File                  |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------------|----------|----------|----------|----------|----------------|
 contracts/           |      100 |       95 |      100 |      100 |                |
  CollateralToken.sol |      100 |      100 |      100 |      100 |                |
  LendingProtocol.sol |      100 |      100 |      100 |      100 |                |
  LoanToken.sol       |      100 |       75 |      100 |      100 |                |
  MockFailToken.sol   |      100 |      100 |      100 |      100 |                |
----------------------|----------|----------|----------|----------|----------------|
All files             |      100 |       95 |      100 |      100 |                |
----------------------|----------|----------|----------|----------|----------------|

```

Coverage Details:

- **Statements**: 100%
- **Branches**: 95%
- **Functions**: 100%
- **Lines**: 100%


---

## 🚀 Frontend (React + Ethers.js)

Para acceder al front-end hacer cd a web_app desde la raiz del proyecto(sold-loans) esto te llevara a la carpeta del front!
Ejemplo: /mnt/c/Users/ariel/OneDrive/Desktop/Final Blockchain/solid-loans/web_app$

### Estructura

* `App.jsx`: Componente principal con conexión a MetaMask, lógica de préstamos, colateral y mint.
* `.env`: Incluye las direcciones de los contratos desplegados en Sepolia.

### Variables necesarias en `.env` de la carpeta de web_app
###  IMPORTANTE – Configuración del .env para el Frontend
### Antes de ejecutar la aplicación frontend, asegurate de tener correctamente configurado el archivo .env dentro de la carpeta web_app  (frontend). Si vas a utilizar los contratos ya desplegados en Sepolia, podés copiar y pegar estas direcciones directamente.
### Si en cambio desplegás nuevos contratos con deploy.js, deberás actualizar estos valores manualmente con las nuevas direcciones que te genere el script.

```env

# Direcciones de contratos en Sepolia (ya desplegados)
VITE_CONTRACT_ADDRESS=0x3de5380316031727D258a8F99F730A7D536886e1  # LendingProtocol
VITE_COLLATERAL_TOKEN_ADDRESS=0x5fc3Eb88EbF29eB38Bb22DB8FF7097a1d8901201 # CollateralToken (cUSD)
VITE_LOAN_TOKEN_ADDRESS=0x372Ca81A22bA121dB691FDB69648Fe61145a399F # LoanToken (dDAI)

```

### Características del Front

* 🔑 Conexión a MetaMask
* 💳 Depósito de colateral (cUSD)
* 💸 Solicitud de préstamo (dDAI) con relación 150%
* 💵 Repago de deuda + interés (5%)
* 🚪 Retiro de colateral si no hay deuda
* 🌟 Botones para obtener cUSD y dDAI al instante (mint local)
* 📈 Visualización de balances, deuda, interés y colateral


---

## 🔄 Flujo para usar 

1. Configurá las direcciones en `.env` reemplazando con los nuevos valores que te dio al hacer el deploy o sino copia 
los que ya coloque en el readme:

VITE_CONTRACT_ADDRESS=0x3de5380316031727D258a8F99F730A7D536886e1
VITE_COLLATERAL_TOKEN_ADDRESS=0x5fc3Eb88EbF29eB38Bb22DB8FF7097a1d8901201
VITE_LOAN_TOKEN_ADDRESS=0x372Ca81A22bA121dB691FDB69648Fe61145a399F

2. Ejecutá el frontend:

```bash
npm run dev
```

3. Interactuá con la DApp desde MetaMask.

---

###  Estructura del proyecto

solid-loans/
├── contracts/
│   ├── LendingProtocol.sol
│   ├── CollateralToken.sol
│   └── LoanToken.sol
├── scripts/
│   ├── deploy.js
│   ├── setMinter.js
│   └── mint.js
├── test/
│   └── ...tests unitarios...
├── web_app/
│   ├── App.jsx
│   └── ...
├── .env                     # Variables de entorno (clave privada, APIs, direcciones)
├── hardhat.config.js        # Configuración de Hardhat
├── README.md                # Documentación del proyecto
└── package.json             # Dependencias y scripts de npm


## 🚨 Troubleshooting

### Common Issues

**"Please connect to Sepolia testnet"**

- Switch your MetaMask to Sepolia testnet
- The DApp will prompt you to switch automatically

**"Insufficient funds"**

- Get Sepolia ETH from faucets
- Use the "Mint cUSD (1000)" or "Mint dDAI (500)" buttons for cUSD and dDAI

**"Transaction failed"**

- Check you have enough ETH for gas
- Ensure you're on Sepolia testnet
- Try increasing gas price in MetaMask

**"Failed to mint test tokens"**

- This feature may be restricted to contract owner
- Ask for test tokens or use alternative methods


### Proyecto final de Blockchain - 2025 🌟

