# Guía de Despliegue - Protocolo de Lending

Esta guía te llevará paso a paso para desplegar completamente el sistema de lending desde cero en una máquina nueva, incluyendo los contratos inteligentes y la aplicación web.

## 📋 Prerrequisitos

### Software Requerido

1. **Node.js** (versión 18 o superior)
   ```bash
   # Verificar versión
   node --version
   npm --version
   ```

2. **Git**
   ```bash
   # Verificar instalación
   git --version
   ```

3. **MetaMask** (extensión del navegador)
   - Instalar desde [metamask.io](https://metamask.io/)

### Conocimientos Básicos
- Familiaridad con terminal/command line
- Conceptos básicos de blockchain y Ethereum
- Conocimiento básico de JavaScript/React

## 🚀 Instalación y Configuración desde Cero

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd blockchain-final/lending-dapp

# Verificar estructura del proyecto
ls -la
```

**Estructura esperada:**
```
lending-dapp/
├── contracts/          # Contratos Solidity
├── scripts/           # Scripts de despliegue
├── test/              # Tests unitarios
├── web_app/           # Aplicación React
├── hardhat.config.js  # Configuración de Hardhat
├── package.json       # Dependencias
└── env.example        # Ejemplo de variables de entorno
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias de Hardhat (contratos)
npm install

# Verificar que se instalaron correctamente
ls node_modules

# Instalar dependencias de la aplicación web
cd web_app
npm install
cd ..
```

### Paso 3: Configurar Variables de Entorno

```bash
# Crear archivo de variables de entorno desde el ejemplo
cp env.example .env

# Editar el archivo .env con tu configuración
nano .env
```

**Contenido del archivo `.env` (ejemplo completo):**
```env
# Clave privada de tu wallet (para despliegue) - SIN 0x al inicio
PRIVATE_KEY=tu_clave_privada_aqui_sin_0x

# URLs de RPC para diferentes redes
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_PROJECT_ID
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/TU_PROJECT_ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/TU_PROJECT_ID

# API Keys para verificación de contratos
ETHERSCAN_API_KEY=tu_etherscan_api_key
POLYGONSCAN_API_KEY=tu_polygonscan_api_key

# URLs de exploradores
ETHERSCAN_URL=https://sepolia.etherscan.io
POLYGONSCAN_URL=https://mumbai.polygonscan.com
```

### Paso 4: Verificar Configuración de Hardhat

El archivo `hardhat.config.js` ya está configurado para múltiples redes. Verifica que esté correcto:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    // Red local para desarrollo
    hardhat: {
      chainId: 1337
    },
    
    // Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    },
    
    // Polygon Mumbai
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001
    },
    
    // Ethereum Mainnet (¡CUIDADO!)
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1
    }
  },
  
  // Configuración para verificación de contratos
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY
    }
  }
};
```

## 🔧 Despliegue de Contratos

### Paso 1: Verificar Configuración

```bash
# Verificar que Hardhat puede compilar los contratos
npx hardhat compile

# Deberías ver algo como:
# Compiled 4 Solidity files successfully
# - CollateralToken.sol
# - LendingProtocol.sol  
# - LoanToken.sol
# - Lock.sol
```

### Paso 2: Ejecutar Tests (Obligatorio antes del despliegue)

```bash
# Ejecutar todos los tests
npm test

# Deberías ver: 89 passing (2s)
# Si hay errores, revisar la configuración antes de continuar
```

### Paso 3: Desplegar en Red Local (Desarrollo)

```bash
# Terminal 1: Iniciar nodo local de Hardhat
npx hardhat node

# Terminal 2: Desplegar contratos
npx hardhat run scripts/deploy.js --network localhost

# Deberías ver las direcciones de los contratos desplegados:
# CollateralToken deployed to: 0x...
# LoanToken deployed to: 0x...
# LendingProtocol deployed to: 0x...
```

### Paso 4: Configurar Aplicación Web para Desarrollo Local

```bash
# Copiar direcciones desplegadas a la aplicación web
cp deployed-addresses.json web_app/src/

# Copiar ABI compilado a la aplicación web
cp artifacts/contracts/LendingProtocol.sol/LendingProtocol.json web_app/src/contractABI.json

# Iniciar aplicación web
cd web_app
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

### Paso 5: Desplegar en Testnet (Recomendado para pruebas)

```bash
# Asegúrate de tener ETH en tu wallet de testnet
# Para Sepolia: https://sepoliafaucet.com/
# Para Mumbai: https://faucet.polygon.technology/

# Desplegar en Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deberías ver las direcciones de los contratos desplegados
# Guarda estas direcciones para la configuración posterior
```

### Paso 6: Verificar Contratos (Opcional pero recomendado)

```bash
# Obtener API key de Etherscan
# https://etherscan.io/apis

# Verificar contratos (reemplaza con las direcciones reales)
npx hardhat verify --network sepolia DIRECCION_COLLATERAL_TOKEN
npx hardhat verify --network sepolia DIRECCION_LOAN_TOKEN
npx hardhat verify --network sepolia DIRECCION_LENDING_PROTOCOL DIRECCION_COLLATERAL_TOKEN DIRECCION_LOAN_TOKEN
```

## 🌐 Configuración de la Aplicación Web

### Paso 1: Configurar Direcciones de Contratos

Después del despliegue, actualiza los archivos de configuración:

```bash
# Copiar direcciones desplegadas
cp deployed-addresses.json web_app/src/

# Copiar ABI compilado
cp artifacts/contracts/LendingProtocol.sol/LendingProtocol.json web_app/src/contractABI.json
```

### Paso 2: Verificar Configuración de la App

Verifica que `web_app/src/deployed-addresses.json` contenga las direcciones correctas:

```json
{
  "collateralToken": "0x...",
  "loanToken": "0x...",
  "lendingProtocol": "0x..."
}
```

### Paso 3: Configurar Red en MetaMask

1. **Abrir MetaMask**
2. **Agregar red personalizada:**
   - **Sepolia Testnet:**
     - Nombre: Sepolia
     - RPC URL: https://sepolia.infura.io/v3/TU_PROJECT_ID
     - Chain ID: 11155111
     - Símbolo: ETH
   - **Mumbai Testnet:**
     - Nombre: Mumbai
     - RPC URL: https://polygon-mumbai.infura.io/v3/TU_PROJECT_ID
     - Chain ID: 80001
     - Símbolo: MATIC

### Paso 4: Ejecutar Aplicación

```bash
# Desde el directorio web_app
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

### Paso 5: Probar Funcionalidad

1. **Conectar MetaMask** a la aplicación
2. **Mint tokens de colateral** (cUSD) usando el botón "Mint cUSD"
3. **Aprobar tokens** para el protocolo
4. **Depositar colateral**
5. **Solicitar préstamo** (dDAI)
6. **Mint tokens de préstamo** (dDAI) para pagar
7. **Pagar deuda**
8. **Retirar colateral**

## 🛠️ Scripts Útiles

### Scripts de Despliegue

```bash
# Desplegar contratos
npx hardhat run scripts/deploy.js --network sepolia

# Verificar contratos
npx hardhat verify --network sepolia DIRECCION_CONTRATO [ARGUMENTOS]

# Ejecutar tests específicos
npx hardhat test --grep "nombre_del_test"

# Limpiar artifacts y cache
npx hardhat clean
```

### Scripts de Mantenimiento

```bash
# Actualizar dependencias
npm update

# Ejecutar tests
npm test

# Verificar seguridad
npm audit

# Construir aplicación para producción
cd web_app
npm run build
```

## 🔒 Consideraciones de Seguridad

### Antes del Despliegue en Mainnet

1. **Auditoría de Seguridad**
   - Contratar auditoría profesional
   - Revisar vulnerabilidades conocidas
   - Los contratos actuales tienen mint público (solo para desarrollo)

2. **Tests Exhaustivos**
   - Ejecutar tests en múltiples redes
   - Probar casos edge y de stress
   - Verificar que todos los 89 tests pasen

3. **Configuración de Redes**
   - Usar nodos RPC confiables
   - Configurar múltiples proveedores
   - Verificar conectividad

4. **Gestión de Claves**
   - Usar wallets hardware
   - Implementar multisig
   - Nunca compartir claves privadas
   - Usar variables de entorno

### Configuración de Producción

```javascript
// hardhat.config.js para producción
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000
    }
  }
};
```

## 🐛 Solución de Problemas

### Errores Comunes

1. **"Insufficient funds"**
   ```bash
   # Obtener ETH de testnet
   # Sepolia: https://sepoliafaucet.com/
   # Mumbai: https://faucet.polygon.technology/
   ```

2. **"Nonce too high"**
   ```bash
   # Resetear MetaMask
   # Settings > Advanced > Reset Account
   ```

3. **"Contract not found"**
   ```bash
   # Verificar direcciones en deployed-addresses.json
   # Verificar red en MetaMask
   # Verificar que los contratos estén desplegados
   ```

4. **"Gas estimation failed"**
   ```bash
   # Aumentar gas limit
   # Verificar parámetros de la transacción
   # Verificar que el usuario tenga tokens suficientes
   ```

5. **"Tests failing"**
   ```bash
   # Verificar que todas las dependencias estén instaladas
   # Verificar configuración de Hardhat
   # Ejecutar npm test para ver errores específicos
   ```

### Logs y Debugging

```bash
# Ver logs detallados
npx hardhat run scripts/deploy.js --network sepolia --verbose

# Debug con console.log
npx hardhat console --network sepolia

# Ver logs de la aplicación web
cd web_app
npm run dev
# Revisar consola del navegador para errores
```

## 📊 Monitoreo y Mantenimiento

### Herramientas de Monitoreo

1. **Etherscan/Polyscan**
   - Monitorear transacciones
   - Verificar contratos
   - Ver logs de eventos

2. **The Graph** (futuro)
   - Indexar eventos
   - Crear APIs

3. **Tenderly** (futuro)
   - Debugging de transacciones
   - Alertas de errores

### Mantenimiento Regular

```bash
# Actualizar dependencias
npm update

# Ejecutar tests
npm test

# Verificar seguridad
npm audit

# Limpiar cache
npx hardhat clean
```


## 🎯 Estado del Proyecto

- ✅ **Contratos**: Completamente funcionales y testeados
- ✅ **Tests**: 89 tests pasando
- ✅ **Aplicación Web**: React + Vite + Ethers v6
- ✅ **Despliegue**: Automatizado y documentado
- ✅ **Documentación**: Completa y actualizada

---

## ✅ Checklist de Despliegue

- [ ] Node.js instalado (v18+)
- [ ] Git instalado
- [ ] MetaMask instalado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install` en root y `web_app`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Hardhat configurado (`hardhat.config.js`)
- [ ] Tests ejecutados y pasando (`npm test`)
- [ ] Contratos compilados (`npx hardhat compile`)
- [ ] Contratos desplegados en testnet (`npx hardhat run scripts/deploy.js --network sepolia`)
- [ ] Contratos verificados (opcional)
- [ ] Direcciones copiadas a la app (`deployed-addresses.json` y `contractABI.json`)
- [ ] Aplicación web configurada y ejecutándose (`cd web_app && npm run dev`)
- [ ] MetaMask conectado a la red correcta
- [ ] Funcionalidad básica probada (mint, deposit, borrow, repay, withdraw)
- [ ] Documentación actualizada

