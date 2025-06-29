# Protocolo de Lending - DeFi

Un protocolo de lending descentralizado construido con Solidity y React, que permite a los usuarios depositar colateral y solicitar préstamos.

## 📋 Características

- **Depósito de Colateral**: Los usuarios pueden depositar tokens cUSD como colateral
- **Préstamos**: Solicitar préstamos en tokens dDAI hasta un 66.67% del colateral
- **Tasa de Interés**: 5% fijo por semana
- **Ratio de Colateralización**: 150% (requiere 1.5x el valor del préstamo en colateral)
- **Pago de Deudas**: Pagar préstamos con intereses acumulados
- **Retiro de Colateral**: Retirar colateral cuando no hay deuda pendiente
- **Mint de Tokens**: Funcionalidad de desarrollo para mintear tokens (cualquier cuenta puede mint)

## 🏗️ Arquitectura

### Contratos Inteligentes

- **LendingProtocol.sol**: Contrato principal del protocolo con cálculo de intereses por tiempo
- **CollateralToken.sol**: Token de colateral (cUSD) con mint público para desarrollo
- **LoanToken.sol**: Token de deuda (dDAI) con mint público para desarrollo

### Aplicación Web

- **React + Vite**: Frontend moderno y rápido
- **Ethers.js v6**: Interacción con blockchain usando BrowserProvider
- **MetaMask**: Conexión de wallet
- **Toast notifications**: Feedback visual para el usuario

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v18+)
- npm o yarn
- MetaMask
- Git

### Instalación desde Cero

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd lending-dapp

# 2. Instalar dependencias del proyecto
npm install

# 3. Instalar dependencias de la aplicación web
cd web_app
npm install
cd ..

# 4. Configurar variables de entorno
cp env.example .env
# Editar .env con tus claves privadas y URLs de RPC
```

### Configuración de Variables de Entorno

Edita el archivo `.env` con tus configuraciones:

```env
# Clave privada de la cuenta que desplegará los contratos
PRIVATE_KEY=tu_clave_privada_sin_0x

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

### Desarrollo Local

```bash
# 1. Compilar contratos
npx hardhat compile

# 2. Ejecutar tests (recomendado antes del despliegue)
npm test

# 3. Iniciar nodo local de Hardhat
npx hardhat node

# 4. Desplegar contratos (en otra terminal)
npx hardhat run scripts/deploy.js --network localhost

# 5. Copiar direcciones desplegadas a la aplicación web
cp deployed-addresses.json web_app/src/

# 6. Copiar ABI compilado a la aplicación web
cp artifacts/contracts/LendingProtocol.sol/LendingProtocol.json web_app/src/contractABI.json

# 7. Iniciar aplicación web
cd web_app
npm run dev
```

## 📖 Documentación

- **[Guía de Despliegue](DEPLOY_README.md)**: Instrucciones completas para desplegar en diferentes redes
- **[Tests](TEST_README.md)**: Documentación de los tests unitarios y de integración

## 🔧 Configuración

### Redes Soportadas

- **Hardhat Local**: Desarrollo local (http://localhost:8545)
- **Sepolia**: Testnet de Ethereum
- **Mumbai**: Testnet de Polygon
- **Ethereum Mainnet**: Producción (¡cuidado!)

### Configuración de Hardhat

El archivo `hardhat.config.js` incluye configuraciones para todas las redes soportadas con variables de entorno.

## 🧪 Testing

```bash
# Ejecutar todos los tests (89 tests)
npm test

# Tests específicos
npx hardhat test test/LendingProtocol.test.js
npx hardhat test test/Integration.test.js
npx hardhat test test/CollateralToken.test.js
npx hardhat test test/LoanToken.test.js

# Tests con coverage (si está configurado)
npx hardhat coverage
```

### Cobertura de Tests

- **LendingProtocol**: Tests completos de todas las funciones del protocolo
- **CollateralToken**: Tests de mint, transfer y allowances
- **LoanToken**: Tests de mint, transfer y allowances  
- **Integración**: Tests del flujo completo del protocolo

## 📊 Funcionalidades del Protocolo

### Para Usuarios

1. **Depositar Colateral**
   - Aprobar tokens cUSD para el protocolo
   - Depositar colateral en el protocolo
   - Ver colateral disponible y límite de préstamo

2. **Solicitar Préstamo**
   - Calcular límite disponible (66.67% del colateral)
   - Solicitar tokens dDAI
   - Ver deuda actual e intereses acumulados

3. **Pagar Deuda**
   - Aprobar tokens dDAI para el protocolo
   - Pagar deuda + intereses acumulados
   - Resetear deuda y timestamp de interés

4. **Retirar Colateral**
   - Solo disponible sin deuda pendiente
   - Recibir tokens cUSD de vuelta a la wallet

5. **Mint de Tokens (Desarrollo)**
   - Mint cUSD para desarrollo y testing
   - Mint dDAI para desarrollo y testing

### Parámetros del Protocolo

- **Tasa de Interés**: 5% fijo por semana
- **Ratio de Colateralización**: 150%
- **Límite de Préstamo**: 66.67% del colateral
- **Cálculo de Interés**: Basado en tiempo transcurrido (semanas)

## 🔒 Seguridad

- Contratos auditados y testeados exhaustivamente
- Validaciones exhaustivas en todas las funciones
- Manejo de casos edge y errores
- Prevención de ataques comunes (reentrancy, overflow, etc.)
- Custom errors para mejor manejo de errores
- Funciones de mint públicas solo para desarrollo

## 🛠️ Scripts Útiles

```bash
# Despliegue completo con verificación
npx hardhat run scripts/deploy.js --network sepolia

# Verificar contratos individuales
npx hardhat verify --network sepolia DIRECCION_CONTRATO [ARGUMENTOS]

# Ejecutar tests específicos
npx hardhat test --grep "nombre_del_test"

# Limpiar artifacts y cache
npx hardhat clean
```

## 🚀 Despliegue en Producción

### Pasos para Despliegue

1. **Preparación**:
   ```bash
   npm install
   cp env.example .env
   # Configurar .env con claves de producción
   ```

2. **Tests**:
   ```bash
   npm test
   ```

3. **Compilación**:
   ```bash
   npx hardhat compile
   ```

4. **Despliegue**:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Verificación**:
   ```bash
   npx hardhat verify --network sepolia DIRECCION_LENDING_PROTOCOL DIRECCION_COLLATERAL_TOKEN DIRECCION_LOAN_TOKEN
   ```

6. **Configuración de la App**:
   ```bash
   cp deployed-addresses.json web_app/src/
   cp artifacts/contracts/LendingProtocol.sol/LendingProtocol.json web_app/src/contractABI.json
   ```

### Configuración Post-Despliegue

1. Actualizar `web_app/src/deployed-addresses.json` con las nuevas direcciones
2. Actualizar `web_app/src/contractABI.json` con el ABI compilado
3. Configurar variables de entorno en la aplicación web si es necesario

## 📈 Roadmap

- [x] Protocolo básico de lending
- [x] Tests completos
- [x] Interfaz web funcional
- [x] Despliegue automatizado
- [ ] Interfaz de administración
- [ ] Múltiples tipos de colateral
- [ ] Tasas de interés variables
- [ ] Liquidaciones automáticas
- [ ] Integración con oráculos
- [ ] Mobile app


## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

