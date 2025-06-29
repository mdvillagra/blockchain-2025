# 🏦 Protocolo de Préstamos DeFi - cUSD/dDAI

Un protocolo de préstamos descentralizado simple sin intermediarios que permite depositar cUSD como colateral y pedir prestado dDAI con interés fijo semanal del 5%.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Despliegue](#-despliegue)
- [Uso del Frontend](#-uso-del-frontend)
- [Pruebas](#-pruebas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contratos Inteligentes](#-contratos-inteligentes)
- [API del Protocolo](#-api-del-protocolo)
- [Ejemplos de Uso](#-ejemplos-de-uso)
- [Solución de Problemas](#-solución-de-problemas)
- [Configuración Avanzada](#-configuración-avanzada)
- [Contribución](#-contribución)

## 🚀 Características

- **Depositar Colateral**: Los usuarios depositan cUSD como garantía
- **Préstamos dDAI**: Pide prestado hasta el 66.67% de tu colateral (ratio 150%)
- **Interés Fijo**: 5% por semana, sin cálculo compuesto
- **Sin Oráculos**: Sistema simple sin dependencias de precios externos
- **Sin Liquidación Automática**: Control total del usuario
- **Interfaz Web**: DApp React intuitiva y fácil de usar
- **Simulación de Tiempo**: Cada repago simula el paso de una semana

### Ejemplo Práctico
```
Depositas: 150 cUSD → Puedes pedir: 100 dDAI → Repagar: 105 dDAI (100 + 5%)
```

## 🛠 Requisitos

### Software Necesario
- **Node.js** v18+ ([Descargar](https://nodejs.org/))
- **npm** v8+ (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com/))
- **MetaMask** ([Instalar extensión](https://metamask.io/))

### Verificar Instalación
```bash
node --version  # Debe ser v18+
npm --version   # Debe ser v8+
git --version   # Cualquier versión reciente
```

## 📦 Instalación

### 1. Clonar el Repositorio
```bash
git clone <tu-repositorio>
cd lending-protocol
```

### 2. Instalación Automática (Recomendado)
```bash
# Instala dependencias y ejecuta setup completo
npm run setup
```

Este comando:
- ✅ Instala todas las dependencias
- ✅ Compila los contratos
- ✅ Inicia red local de Hardhat
- ✅ Despliega los contratos
- ✅ Copia ABIs al frontend
- ✅ Instala dependencias del frontend
- ✅ Inicia el servidor de desarrollo

### 3. Instalación Manual (Paso a Paso)
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del frontend
cd web_app
npm install
cd ..

# Compilar contratos
npm run compile

# En una terminal separada: iniciar red local
npm run node

# En otra terminal: desplegar contratos
npm run deploy:local

# Iniciar frontend
cd web_app
npm run dev
```

## ⚙️ Configuración

### 1. Variables de Entorno

El proyecto incluye archivos `.env` preconfigurados:

**Archivo principal `.env`:**
```env
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
EPHEMERY_RPC_URL=https://eph.ephemery.dev

# Direcciones de contratos (se actualizan automáticamente al desplegar)
VITE_LENDING_PROTOCOL_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_COLLATERAL_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_LOAN_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Archivo frontend `web_app/.env`:**
```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337

# Direcciones de contratos
VITE_LENDING_PROTOCOL_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_COLLATERAL_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_LOAN_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 2. Configuración de MetaMask

#### Agregar Red Local
1. Abrir MetaMask
2. Ir a **Configuración** → **Redes** → **Agregar Red**
3. Configurar:
   ```
   Nombre de Red: Hardhat Local
   Nueva URL de RPC: http://127.0.0.1:8545
   ID de Cadena: 31337
   Símbolo de Moneda: ETH
   ```

#### Importar Cuenta de Prueba
```bash
# Clave privada de la primera cuenta de Hardhat (solo para desarrollo)
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**⚠️ ADVERTENCIA**: Esta clave es pública y solo para desarrollo local.

### 3. Configuración para Ephemery (Testnet)

```javascript
// hardhat.config.js
networks: {
  ephemery: {
    url: "https://rpc.ephemery.dev",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 42069
  }
}
```

## 🚀 Despliegue

### Red Local (Desarrollo)
```bash
# Método 1: Automático
npm run setup

# Método 2: Manual
# Terminal 1:
npm run node

# Terminal 2:
npm run deploy:local
```

### Testnet Ephemery
```bash
# Configurar PRIVATE_KEY en .env
npm run deploy:ephemery
```

### Verificación del Despliegue
El script mostrará algo como:
```
🚀 Starting deployment of Lending Protocol...
✅ CollateralToken (cUSD) deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ LoanToken (dDAI) deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ LendingProtocol deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
💰 Funded contract with 500000.0 dDAI
✅ Minted 10000.0 tokens for testing
```

## 🌐 Uso del Frontend

### 1. Iniciar la Aplicación
```bash
cd web_app
npm run dev
```

Visita `http://localhost:5173` (Vite) o `http://localhost:3000`

### 2. Conectar Wallet
1. Hacer clic en **"Conectar Wallet"**
2. Aprobar conexión en MetaMask
3. Asegúrate de estar en la red Hardhat Local

### 3. Obtener Tokens de Prueba

El script de despliegue automáticamente:
- Mint 10,000 cUSD y dDAI al deployer
- Financia el contrato con 500,000 dDAI para préstamos

### 4. Flujo de Uso Completo

#### 1. Depositar Colateral
- Ir a **"💎 Depositar Colateral"**
- Ver tu balance de cUSD disponible
- Ingresar cantidad (ej: 150)
- Hacer clic en "Max" para usar todo el balance
- El sistema calcula automáticamente cuánto podrás pedir prestado
- Aprobar transacción de cUSD
- Confirmar depósito

#### 2. Pedir Préstamo
- Ir a **"🏦 Solicitar Préstamo"**
- Ver tu capacidad máxima de préstamo
- Ingresar cantidad (máximo 66.67% del colateral)
- Confirmar transacción

#### 3. Monitorear tu Posición
- El dashboard muestra en tiempo real:
  - Colateral depositado
  - Deuda actual
  - Interés acumulado
  - Semanas transcurridas
  - Ratio de salud
  - Disponible para pedir prestado

#### 4. Repagar Préstamo
- Ir a **"💳 Pagar Deuda"**
- El sistema calcula automáticamente:
  - Deuda principal
  - Interés acumulado
  - Interés de la próxima semana (5%)
  - Total a repagar
- Verificar que tienes suficiente balance de dDAI
- Aprobar transacción de dDAI
- Confirmar repago (simula una semana)

#### 5. Retirar Colateral
- Asegúrate de no tener deuda pendiente
- Ir a **"💎 Retirar Colateral"**
- El sistema retira TODO el colateral de una vez
- Confirmar transacción

## 🧪 Pruebas

### Ejecutar Todas las Pruebas
```bash
npx hardhat test
```

### Cobertura de Código
```bash
npx hardhat coverage
```

**Resultados actuales de cobertura:**
- **Statements**: 100% (35/35)
- **Branches**: 84.21% (32/38)
- **Functions**: 100% (14/14)
- **Lines**: 100% (52/52)

### Pruebas Específicas
```bash
# Solo pruebas de préstamos
npx hardhat test --grep "Borrowing"

# Solo pruebas de repago
npx hardhat test --grep "Repayment"

# Solo pruebas de colateral
npx hardhat test --grep "Collateral"
```

### Casos de Prueba Incluidos
- ✅ **Deployment**: Configuración correcta de contratos
- ✅ **Depósito de colateral**: Exitoso y validaciones de error
- ✅ **Préstamos**: Con colateral suficiente/insuficiente
- ✅ **Cálculo de interés**: 5% semanal correcto
- ✅ **Repago**: Exitoso y validaciones
- ✅ **Retiro de colateral**: Con/sin deuda pendiente
- ✅ **Casos límite**: Montos máximos, múltiples usuarios
- ✅ **Funciones de owner**: Financiamiento del contrato
- ✅ **Flujo completo**: Ciclo completo de usuario

## 📁 Estructura del Proyecto

```
lending-protocol/
├── contracts/                     # Contratos Solidity
│   ├── LendingProtocol.sol        # Contrato principal del protocolo
│   ├── CollateralToken.sol        # Token cUSD (Celo USD)
│   ├── LoanToken.sol              # Token dDAI (Decentralized DAI)
│   └── Lock.sol                   # Contrato de ejemplo (no usado)
├── scripts/                       # Scripts de despliegue
│   └── deploy.js                  # Script principal de despliegue
├── test/                          # Suite de pruebas
│   └── LendingProtocol.js         # Pruebas completas del protocolo
├── web_app/                       # Frontend React
│   ├── src/
│   │   ├── App.jsx                # Componente principal
│   │   ├── UserPosition.jsx       # Dashboard del usuario
│   │   ├── CollateralManager.jsx  # Gestor de colateral
│   │   ├── BorrowManager.jsx      # Gestor de préstamos
│   │   ├── RepayManager.jsx       # Gestor de repagos
│   │   ├── WithdrawManager.jsx    # Gestor de retiros
│   │   ├── App.css               # Estilos principales
│   │   ├── index.css             # Estilos base
│   │   └── main.jsx              # Punto de entrada
│   ├── public/                    # Archivos públicos
│   ├── .env                      # Variables de entorno del frontend
│   └── package.json              # Dependencias del frontend
├── artifacts/                     # Artifacts compilados de Hardhat
├── cache/                         # Cache de compilación
├── coverage/                      # Reportes de cobertura de código
│   └── index.html                # Reporte de cobertura HTML
├── .env                          # Variables de entorno principales
├── hardhat.config.js             # Configuración de Hardhat
├── setup_project.js              # Script de configuración automática
├── package.json                  # Dependencias principales
└── README.md                     # Este archivo
```

## 🔧 Contratos Inteligentes

### LendingProtocol.sol - Contrato Principal

#### Constantes del Protocolo
```solidity
uint256 public constant COLLATERAL_RATIO = 150;      // 150% ratio
uint256 public constant WEEKLY_INTEREST_RATE = 5;    // 5% semanal
```

#### Estructura de Datos
```solidity
struct UserPosition {
    uint256 collateral;        // Cantidad de cUSD depositada
    uint256 debt;             // Cantidad de dDAI prestada
    uint256 weeksPassed;      // Número de semanas simuladas
    uint256 totalInterest;    // Interés total acumulado
}
```

#### Funciones Principales
```solidity
// Depositar colateral
function depositCollateral(uint256 amount) external

// Pedir préstamo
function borrow(uint256 amount) external

// Repagar deuda (simula una semana)
function repay() external

// Retirar todo el colateral
function withdrawCollateral() external

// Obtener datos del usuario
function getUserData(address user) external view returns (
    uint256 collateral,
    uint256 debt,
    uint256 totalInterest,
    uint256 weeksPassed,
    uint256 maxBorrowAmount
)

// Solo owner: Financiar contrato
function fundContract(uint256 amount) external onlyOwner

// Ver balance del contrato
function getContractBalance() external view returns (uint256)
```

### CollateralToken.sol - Token cUSD
```solidity
contract CollateralToken is ERC20, Ownable {
    constructor() ERC20("Celo USD", "cUSD") Ownable(msg.sender)
    
    // Función mint para pruebas
    function mint(address to, uint256 amount) external onlyOwner
}
```

### LoanToken.sol - Token dDAI
```solidity
contract LoanToken is ERC20, Ownable {
    constructor() ERC20("Decentralized DAI", "dDAI") Ownable(msg.sender)
    
    // Función mint para pruebas
    function mint(address to, uint256 amount) external onlyOwner
}
```

## 📊 API del Protocolo

### Eventos Emitidos
```solidity
event CollateralDeposited(address indexed user, uint256 amount);
event LoanBorrowed(address indexed user, uint256 amount);
event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
event CollateralWithdrawn(address indexed user, uint256 amount);
```

### Cálculos Importantes

#### Máximo Préstamo
```javascript
maxBorrow = (collateral * 100) / 150  // 66.67% del colateral
```

#### Interés Semanal
```javascript
weeklyInterest = (debt * 5) / 100     // 5% de la deuda actual
totalToRepay = debt + totalInterest + weeklyInterest
```

#### Ratio de Salud
```javascript
healthRatio = (collateral / (debt * 1.5)) * 100
// > 100%: Saludable
// < 100%: En riesgo (aunque no hay liquidación automática)
```

## 💡 Ejemplos de Uso

### Caso de Uso 1: Usuario Nuevo - Ciclo Completo
```javascript
// 1. Usuario deposita 300 cUSD
await collateralToken.approve(lendingAddress, ethers.parseEther("300"));
await lendingProtocol.depositCollateral(ethers.parseEther("300"));

// 2. Puede pedir hasta 200 dDAI (300/1.5)
await lendingProtocol.borrow(ethers.parseEther("200"))

// 3. Para repagar después de "una semana": 200 + 10 = 210 dDAI
await loanToken.approve(lendingAddress, ethers.parseEther("210"));
await lendingProtocol.repay(); // Simula una semana

// 4. Puede retirar todo su colateral
await lendingProtocol.withdrawCollateral();
```

### Caso de Uso 2: Préstamos Múltiples
```javascript
// Usuario con 150 cUSD depositado (puede pedir hasta 100 dDAI)
await lendingProtocol.borrow(ethers.parseEther("50"));  // Primera vez
await lendingProtocol.borrow(ethers.parseEther("30"));  // Segunda vez
await lendingProtocol.borrow(ethers.parseEther("20"));  // Tercera vez
// Total: 100 dDAI prestado, límite alcanzado
```

### Caso de Uso 3: Simulación de Múltiples Semanas
```javascript
// Semana 1: Pedir 100 dDAI
await lendingProtocol.borrow(ethers.parseEther("100"));

// "Semana 2": Repagar (100 + 5 = 105 dDAI)
await loanToken.approve(lendingAddress, ethers.parseEther("105"));
await lendingProtocol.repay(); // weeksPassed = 1, se resetea la posición

// Puede volver a pedir prestado
await lendingProtocol.borrow(ethers.parseEther("100"));
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. "Contract address not configured"
**Causa**: Los contratos no están desplegados o las variables de entorno no están configuradas.

**Solución**:
```bash
npm run setup
# o manualmente:
npm run deploy:local
```

#### 2. "Wrong Network Connected"
**Causa**: MetaMask no está conectado a la red Hardhat Local.

**Solución**: 
- Usar el botón "Switch to Hardhat Network" en la interfaz
- O configurar manualmente en MetaMask (ver sección de configuración)

#### 3. "Transfer failed" al depositar
**Causa**: No hay approval suficiente de tokens.

**Solución**: El frontend maneja esto automáticamente. Si persiste:
```javascript
// Manual
await collateralToken.approve(lendingAddress, amount);
```

#### 4. "Insufficient collateral"
**Causa**: Intentas pedir más del 66.67% del colateral.

**Solución**: 
- Depositar más colateral, o
- Pedir una cantidad menor

#### 5. "Cannot withdraw with pending debt"
**Causa**: Tienes deuda pendiente.

**Solución**: Repagar toda la deuda primero usando el RepayManager.

#### 6. "No matching fragment" en withdrawCollateral
**Causa**: Llamando withdrawCollateral() con parámetros cuando no los acepta.

**Solución**: La función no acepta parámetros, retira TODO el colateral:
```javascript
await lendingProtocol.withdrawCollateral();
```

### Logs de Debug

#### Frontend con Información Detallada
El componente UserPosition incluye información de debug detallada:
- Direcciones de contratos
- Chain ID actual vs esperado
- Estado de conexión del wallet
- Diagnóstico automático

#### Habilitar Logs de Hardhat
```javascript
// En hardhat.config.js
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
    loggingEnabled: true
  }
}
```

### Comandos de Limpieza

#### Limpiar Proyecto Completamente
```bash
# Detener procesos de Node
# Windows:
taskkill /F /IM node.exe

# Linux/Mac:
pkill -f "hardhat node"

# Limpiar archivos compilados
npx hardhat clean
rm -rf artifacts cache coverage

# Reinstalar todo
npm install
cd web_app && npm install && cd ..
npm run setup
```

#### Resetear MetaMask
1. **Configuración** → **Avanzado** → **Resetear Cuenta**
2. Re-importar cuenta de prueba
3. Reconectar a la DApp

## 🔧 Configuración Avanzada

### Personalizar Parámetros del Protocolo

#### Cambiar Ratio de Colateralización
```solidity
// En LendingProtocol.sol, línea ~12
uint256 public constant COLLATERAL_RATIO = 120; // 120% en lugar de 150%
```

#### Cambiar Tasa de Interés
```solidity
// En LendingProtocol.sol, línea ~13
uint256 public constant WEEKLY_INTEREST_RATE = 3; // 3% en lugar de 5%
```

### Agregar Nuevas Redes

#### Polygon Mumbai
```javascript
// hardhat.config.js
networks: {
  mumbai: {
    url: "https://rpc-mumbai.maticvigil.com",
    accounts: [process.env.PRIVATE_KEY],
    gasPrice: 20000000000,
    chainId: 80001
  }
}
```

#### Goerli Testnet
```javascript
goerli: {
  url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
  accounts: [process.env.PRIVATE_KEY],
  chainId: 5
}
```

### Scripts Personalizados

#### Script para Distribuir Tokens
```javascript
// scripts/distribute-tokens.js
async function main() {
  const [owner] = await ethers.getSigners();
  
  const collateralToken = await ethers.getContractAt(
    "CollateralToken", 
    process.env.VITE_COLLATERAL_TOKEN_ADDRESS
  );
  
  const users = ["0x...", "0x...", "0x..."];
  const amount = ethers.parseEther("1000");
  
  for (const user of users) {
    await collateralToken.mint(user, amount);
    console.log(`Minted ${ethers.formatEther(amount)} cUSD to ${user}`);
  }
}

main().catch(console.error);
```

## 📈 Monitoreo y Analytics

### Escuchar Eventos del Contrato
```javascript
// En el frontend o scripts
lendingProtocol.on("CollateralDeposited", (user, amount) => {
  console.log(`${user} deposited ${ethers.formatEther(amount)} cUSD`);
});

lendingProtocol.on("LoanBorrowed", (user, amount) => {
  console.log(`${user} borrowed ${ethers.formatEther(amount)} dDAI`);
});

lendingProtocol.on("LoanRepaid", (user, principal, interest) => {
  console.log(`${user} repaid ${ethers.formatEther(principal)} dDAI + ${ethers.formatEther(interest)} interest`);
});
```

### Métricas del Protocolo
```javascript
// Script para estadísticas
async function getProtocolStats() {
  const lendingAddress = process.env.VITE_LENDING_PROTOCOL_ADDRESS;
  const totalCollateral = await collateralToken.balanceOf(lendingAddress);
  const availableLiquidity = await lendingProtocol.getContractBalance();
  
  console.log("📊 Protocol Statistics:");
  console.log(`Total Collateral Locked: ${ethers.formatEther(totalCollateral)} cUSD`);
  console.log(`Available Liquidity: ${ethers.formatEther(availableLiquidity)} dDAI`);
  console.log(`Utilization Rate: ${((500000 - parseFloat(ethers.formatEther(availableLiquidity))) / 500000 * 100).toFixed(2)}%`);
}
```

## 🤝 Contribución

### Cómo Contribuir
1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Hacer tus cambios siguiendo los estándares
4. Agregar pruebas para nuevas funcionalidades
5. Ejecutar `npm test` para verificar que todo funciona
6. Commit tus cambios (`git commit -m 'feat: agregar nueva característica'`)
7. Push a la rama (`git push origin feature/nueva-caracteristica`)
8. Abrir un Pull Request

### Estándares de Código
- **Solidity**: Seguir las convenciones de OpenZeppelin
- **JavaScript**: Usar ESLint con la configuración incluida
- **React**: Hooks y componentes funcionales
- **Naming**: Usar camelCase para funciones, PascalCase para componentes
- **Comments**: Documentar funciones públicas y lógica compleja

### Áreas de Mejora Identificadas
1. **Frontend UX/UI**: Mejorar el diseño y experiencia de usuario
2. **Liquidación**: Implementar sistema de liquidación automática
3. **Oráculos**: Integrar feeds de precios para ratios dinámicos
4. **Governance**: Agregar sistema de voting para cambios de parámetros
5. **Flash Loans**: Implementar préstamos flash
6. **Multi-collateral**: Soporte para múltiples tipos de colateral

### Reportar Bugs
Usar GitHub Issues con:
- **Título descriptivo**: ej. "Error en cálculo de interés con deudas pequeñas"
- **Pasos para reproducir**: Lista numerada clara
- **Comportamiento esperado vs actual**
- **Información del entorno**:
  - Versión de Node.js
  - Sistema operativo
  - Versión del navegador
  - Network utilizada
- **Logs relevantes**: Console logs, transaction hashes, error messages

## 📄 Licencia

MIT License - ver LICENSE para detalles completos.

## 🙏 Agradecimientos

- [OpenZeppelin](https://openzeppelin.com/) por los contratos base seguros
- [Hardhat](https://hardhat.org/) por el excelente framework de desarrollo
- [Ethers.js](https://ethers.org/) por la librería de interacción con Ethereum
- [React](https://reactjs.org/) por el framework de frontend
- [Vite](https://vitejs.dev/) por el bundler rápido de desarrollo

---

## 🎯 Estado del Proyecto

**✅ Completado:**
- Protocolo de préstamos funcional y testeado
- Tokens cUSD/dDAI implementados
- Interés fijo del 5% semanal
- Ratio de colateralización 150%
- Frontend React completo y funcional
- Suite de pruebas con 100% cobertura de statements
- Sistema de despliegue automatizado
- Documentación completa

**🚧 En Desarrollo:**
- Mejoras de UX/UI
- Optimizaciones de gas
- Métricas avanzadas del protocolo

**📋 Roadmap Futuro:**
- Sistema de liquidación
- Múltiples tipos de colateral
- Integración de oráculos
- Governance token

---

**⚠️ Aviso Legal**: Este proyecto es para fines educativos y de demostración. No usar en producción sin auditorías de seguridad apropiadas.

**📞 Soporte**: Para preguntas o problemas, abrir un issue en GitHub con la información detallada.

**🚀 ¡Disfruta explorando DeFi!**