# DApp de Préstamos Descentralizados - Examen Final Blockchain

### Integrantes
- Fabrizio Roman
- Esteban Fernandez

### Descripción
Este proyecto implementa una aplicación descentralizada (DApp) de préstamos con garantía colateral donde los usuarios pueden:
- Depositar tokens cUSD como colateral
- Solicitar préstamos en tokens dDAI con un ratio de colateralización del 150%
- Pagar préstamos con interés fijo del 5% semanal
- Retirar su colateral una vez pagado el préstamo completo
- Obtener tokens de prueba directamente desde la web (mint público)

### Tecnologías Utilizadas
- Solidity 0.8.28
- React + Vite
- Ethers.js v5.7
- Hardhat
- OpenZeppelin Contracts
- MetaMask

### Requisitos Previos
- Node.js (v16 o superior)
- MetaMask instalado en el navegador
- Cuenta en Ephemery Testnet con fondos

### Instalación

**Instalar todas las dependencias (backend + frontend)**
```bash
npm run setup
```

O de forma manual:
```bash
# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd web_app && npm install
```

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```env
# Clave privada de tu cuenta (¡NUNCA la compartas!)
PRIVATE_KEY="tu_clave_privada_aquí"

# URLs de la red
VITE_RPC_URL=https://otter.bordel.wtf/erigon

# Direcciones de contratos (serán proporcionadas después del deployment)
VITE_CONTRACT_ADDRESS=0xDF10ed257f71B9CAfa3742e17951Be89cCd137dd
VITE_COLLATERAL_TOKEN_ADDRESS=0xbAa7EbE33E864aE46Ea1B4E3482Cdd542eB78EBA
VITE_LOAN_TOKEN_ADDRESS=0x66e13C6cc853681D6E3CB6879befeAC26142bdf1
```

### Despliegue

**Compilar contratos**
```bash
npm run compile
```

o puedes desplegar otro contrato con tu cuenta:
```bash
npm run deploy
```
**⚠️ IMPORTANTE:** Después del deployment, copiar las direcciones mostradas en la consola al archivo `.env`.

### Tests y Cobertura

El proyecto incluye tests exhaustivos con **100% de cobertura de líneas**:

```bash
# Ejecutar todos los tests
npm run test

# Generar reporte de cobertura
npm run coverage
```

### MetaMask & Ephemery Testnet

1. Abre MetaMask y ve a **Redes → Añadir una red personalizada**.
2. Rellena los campos con estos datos:
   - **Nombre de la red**: `Ephemery Testnet`
   - **URL de RPC**: `https://otter.bordel.wtf/erigon`
   - **ID de cadena**: `39438147`
   - **Símbolo de moneda**: `ETH`
3. Guarda la red y cámbiate a Ephemery Testnet.

### Obtener fondos para la red Ephemery Testnet
Para desplegar tus contratos en Ephemery Testnet necesitarás ETH de prueba. Sigue estos pasos:
1. Abre la faucet `https://ephemery-faucet.pk910.de/` en tu navegador.

2. Ingresa tu dirección de tu cuenta de MetaMask y consigue fondos

### Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Funcionalidades Principales

#### 🪙 **Obtener Tokens de Prueba**
- **Mint Público**: Cualquier usuario puede obtener tokens sin permisos especiales
- Haz clic en "Mintear 1000 cUSD" para obtener tokens de colateral
- Haz clic en "Mintear 1000 dDAI" para obtener tokens para repago  
- Límite: 1000 tokens por tipo cada 24 horas por usuario

#### 💰 **Protocolo de Préstamos**
1. **Conectar Wallet**: Conecta MetaMask a la DApp
2. **Depositar Colateral**: Deposita cUSD como garantía
3. **Pedir Préstamo**: Solicita hasta el 66% del valor del colateral en dDAI
4. **Pagar Préstamo**: Repaga el monto principal + 5% de interés semanal
5. **Retirar Colateral**: Retira tu colateral una vez pagada la deuda

#### 📊 **Métricas del Protocolo**
- **Ratio de Colateralización**: 150%
- **LTV Máximo**: 66%
- **Interés Fijo**: 5% semanal
- **Ratio de Precios**: 1 cUSD = 1 dDAI (fijo)

### Contratos Inteligentes

#### 1. **LendingProtocol.sol** - Contrato Principal
- `depositCollateral(uint256 amount)`: Depositar colateral
- `borrow(uint256 amount)`: Pedir préstamo
- `repay()`: Pagar préstamo completo con interés
- `withdrawCollateral()`: Retirar colateral
- `getUserData(address user)`: Obtener datos del usuario

#### 2. **CollateralToken.sol** - Token cUSD  
- Token ERC20 usado como colateral
- Función `mintForTesting()` para usuarios (1000 tokens/24h)

#### 3. **LoanToken.sol** - Token dDAI
- Token ERC20 usado para préstamos  
- Función `mintForTesting()` para usuarios (1000 tokens/24h)

### Estructura del Proyecto

```
├── contracts/                 # Contratos inteligentes
│   ├── LendingProtocol.sol    # Contrato principal
│   ├── CollateralToken.sol    # Token colateral (cUSD)
│   └── LoanToken.sol          # Token préstamo (dDAI)
├── test/                      # Tests unitarios (100% cobertura)
├── scripts/                   # Scripts de deployment
├── web_app/                   # Aplicación web React
│   ├── src/App.jsx           # Componente principal
│   └── src/App.css           # Estilos
├── hardhat.config.js         # Configuración Hardhat
└── package.json              # Dependencias principales
```


**Tests incluidos:**
- ✅ Deployment y configuración inicial
- ✅ Depósito de colateral (casos exitosos y de error)
- ✅ Solicitud de préstamos (validaciones de ratio)
- ✅ Pago de préstamos (cálculo de interés)
- ✅ Retiro de colateral (validaciones de deuda)
- ✅ Funcionalidad ERC20 de tokens
- ✅ Manejo de errores y edge cases
