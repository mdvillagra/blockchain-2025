# DeFi Lend - Protocolo de Préstamos Descentralizado

Este proyecto implementa un protocolo de préstamos descentralizado que permite a los usuarios depositar tokens como colateral y solicitar préstamos con un ratio de colateralización del 150%. Incluye un frontend profesional inspirado en plataformas DeFi reales.

## 🌐 Demo en Vivo

Puedes ver y probar el proyecto en vivo aquí:

👉 **[Prueba en Vivo - DeFi Lend](https://defi-lend-protocol.vercel.app/)**

> **Nota:** Asegúrate de tener MetaMask instalado y configurado con la red Ephemery Testnet para interactuar con la aplicación.

## 🎯 Características

- **Faucet integrado**: Obtén tokens gratuitos cada hora para probar
- **Depósito de colateral**: Deposita cUSD como colateral
- **Préstamos descentralizados**: Solicita préstamos en dDAI
- **Ratio de colateralización**: 150% mínimo requerido
- **Interés fijo**: 5% semanal sin composición
- **Interfaz profesional**: Frontend moderno inspirado en Aave/Compound
- **ABIs automáticos**: Sistema de sincronización automática de ABIs

## 🚀 Tecnologías Utilizadas

### Backend
- **Solidity** - Contratos inteligentes
- **Hardhat** - Framework de desarrollo
- **OpenZeppelin** - Librerías de seguridad
- **Ephemery Testnet** - Red de pruebas

### Frontend
- **React 19** - Framework de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos modernos
- **ethers.js** - Interacción con blockchain
- **Lucide React** - Iconografía
- **MetaMask** - Integración de wallet

## 📦 Instalación Rápida

```bash
# Clonar e instalar dependencias
git clone <url-del-repositorio>
cd defi-lend-protocol
npm run setup  # Instala dependencias del proyecto y frontend

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus datos:
# - PRIVATE_KEY: Tu clave privada para despliegue
# - USER_ADDRESS: Tu dirección de wallet (solo si vas a desplegar)
# - Direcciones de contratos (si vas a desplegar nuevos)
```

> **✅ Configuración simplificada:** Solo necesitas UN archivo `.env` en la raíz que sirve tanto para Hardhat como para el frontend.

## 🛠️ Scripts Disponibles

### Desarrollo Principal
```bash
npm run setup           # Instalar todas las dependencias
npm run clean           # Limpiar artifacts y cache de Hardhat
npm run compile         # Solo compilar contratos
npm run build-contracts # Limpiar + compilar + copiar ABIs (completo)
npm run copy-abi        # Solo copiar ABIs al frontend
npm run test            # Ejecutar tests
npm run coverage        # Coverage de tests
npm run deploy          # Desplegar a Ephemery
```

### Frontend
```bash
npm run start-app       # Iniciar frontend desde raíz del proyecto
npm run dev:frontend    # Servidor de desarrollo del frontend
npm run build:frontend  # Build del frontend para producción
```

## 🔄 Sistema de ABIs Automático

El proyecto incluye un sistema automatizado para mantener sincronizados los ABIs entre contratos y frontend:

```bash
# Flujo automático
npm run build-contracts  # compile + copy-abi

# Manual si es necesario
npm run copy-abi
```

**Qué hace:**
- Copia ABIs compilados a `web_app/src/abi/`
- Extrae solo información necesaria (ABI, bytecode)
- Crea archivo de índice para importaciones fáciles
- El frontend detecta automáticamente ABIs nuevos

## 📁 Estructura del Proyecto

```
├── .env                        # ← Variables de entorno (Hardhat + Frontend)
├── env.example                 # ← Plantilla de configuración
├── contracts/
│   ├── LendingProtocol.sol     # Contrato principal
│   ├── CollateralToken.sol     # Token cUSD  
│   └── LoanToken.sol           # Token dDAI
├── scripts/
│   ├── deploy.js               # Script de despliegue
│   ├── copyAbi.js              # Copia ABIs al frontend
│   └── README.md               # Documentación de scripts
├── test/
│   └── LendingProtocol.test.js # Tests unitarios
├── web_app/                    # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── abi/               # ABIs auto-generados
│   │   └── App.jsx            # Componente principal
│   ├── vite.config.js          # ← Lee ../env
│   └── README.md              # Documentación del frontend
├── hardhat.config.cjs          # Configuración de Hardhat
└── package.json               # Scripts y dependencias
```

## 🎨 Frontend Profesional

El frontend incluye:

- **Dashboard intuitivo** con métricas en tiempo real
- **Factor de salud visual** con alertas inteligentes
- **Panel de acciones** con validaciones en vivo
- **Sistema de notificaciones** para feedback inmediato
- **Diseño responsive** para todos los dispositivos
- **Tema oscuro profesional** con efectos glassmorphism

### Capturas de Funcionalidades

- ✅ Conexión de wallet con dropdown detallado
- ✅ Dashboard de métricas con cálculos automáticos
- ✅ Factor de salud con barras de progreso
- ✅ Alertas cuando el ratio está en riesgo
- ✅ Panel de acciones con tabs organizadas
- ✅ Validaciones en tiempo real
- ✅ Aprovación automática de tokens
- ✅ Estados de carga y feedback visual

## ⚙️ Configuración

### Variables de Entorno

**Archivo único (.env en la raíz):**
```env
# Para despliegue de contratos con Hardhat
PRIVATE_KEY=tu_clave_privada_para_despliegue

# Para despliegue de contratos (requerido solo si vas a desplegar)
USER_ADDRESS=tu_direccion_de_wallet_para_recibir_tokens

# Para el frontend (prefijo VITE_ requerido)
VITE_LENDING_PROTOCOL_ADDRESS=0x3dca7A45C6515601216f9EFE2bC3eBF4aB40F472
VITE_COLLATERAL_TOKEN_ADDRESS=0x7cD29C8E3f9adF4E8Ab142eFa80Df23D2b558b5B
VITE_LOAN_TOKEN_ADDRESS=0x9e1b222EA3Ac8C46638F3533F9518D70E9D33fcc
VITE_RPC_URL=https://rpc.ephemery.dev
```

> **⚠️ Importante:** 
> - Un solo archivo `.env` en la raíz sirve para Hardhat Y el frontend
> - Vite está configurado para leer desde `../env` (raíz del proyecto)
> - El archivo está en `.gitignore` por seguridad

### Red Ephemery en MetaMask
```
Nombre: Ephemery Testnet
RPC URL: https://rpc.ephemery.dev
Chain ID: 39438135
Símbolo: ETH
```

## 🧪 Desarrollo y Testing

```bash
# Desarrollo local
npm run build-contracts  # Compilación completa (limpia + compila + ABIs)
npm run test            # Ejecutar tests
npm run coverage        # Ver cobertura de tests
npm run start-app       # Desarrollo del frontend (desde raíz)

# Desarrollo iterativo
npm run build-contracts # Compilación completa + ABIs
npm run clean           # Limpiar cuando hay problemas

# Despliegue
npm run deploy          # Despliega a Ephemery
# ⚠️ IMPORTANTE: Luego actualiza las direcciones VITE_* en .env con los nuevos contratos
```

## 🔒 Testing y Cobertura

Los tests unitarios cubren:
- ✅ Depósito de colateral
- ✅ Solicitud de préstamos con validaciones
- ✅ Cálculo de intereses
- ✅ Pago de préstamos
- ✅ Retiro de colateral
- ✅ Casos de error y validaciones
- ✅ Ratio de colateralización
- ✅ Integración con tokens ERC20

```bash
npm run coverage  # Para ver reporte completo
```

## 📋 Contratos Desplegados en Ephemery Testnet

| Contrato | Dirección |
|----------|-----------|
| LendingProtocol | `0x3dca7A45C6515601216f9EFE2bC3eBF4aB40F472` |
| CollateralToken (cUSD) | `0x7cD29C8E3f9adF4E8Ab142eFa80Df23D2b558b5B` |
| LoanToken (dDAI) | `0x9e1b222EA3Ac8C46638F3533F9518D70E9D33fcc` |

> ✅ **Contratos verificados y desplegados en Ephemery Testnet**  
> 🔗 Puedes verificar estos contratos en el explorador de Ephemery

## 🌐 Uso de la DApp

### 1. Configuración Inicial
- Instalar MetaMask
- Añadir red Ephemery Testnet
- Obtener ETH de testnet para gas

### 2. Obtener Tokens para Probar

#### 🚀 **Si usas los contratos ya desplegados:**
La aplicación incluye un **faucet integrado** que permite a cualquier usuario obtener tokens gratuitos:

- **100 cUSD** cada hora para usar como colateral
- **100 dDAI** cada hora para pagar préstamos
- **Cooldown de 1 hora** entre usos para evitar spam
- **Acceso directo** desde la interfaz principal (tab "Obtener Tokens")

#### 🔧 **Si despliegas nuevos contratos:**
**Requisito previo:** Debes configurar la variable `USER_ADDRESS` en tu archivo `.env` con tu dirección de wallet.

Al ejecutar `npm run deploy`, automáticamente recibirás:
- **100 cUSD** en tu wallet (para usar como colateral)
- **100 dDAI** en tu wallet (para pagar préstamos)
- **1000 dDAI** se envían al protocolo (para préstamos)

> **⚠️ Importante:** Sin la variable `USER_ADDRESS` configurada, el despliegue fallará.

### 3. Ver Tokens en MetaMask

Para ver tus tokens cUSD y dDAI en MetaMask:

1. **Abrir MetaMask** y asegurarte de estar en la red Ephemery
2. **Hacer clic en "Importar tokens"**
3. **Agregar token cUSD:**
   - Dirección: `0x7cD29C8E3f9adF4E8Ab142eFa80Df23D2b558b5B`
   - Símbolo: `cUSD`
   - Decimales: `18`
4. **Agregar token dDAI:**
   - Dirección: `0x9e1b222EA3Ac8C46638F3533F9518D70E9D33fcc`
   - Símbolo: `dDAI`
   - Decimales: `18`

> **💡 Tip:** Una vez importados, podrás ver tus balances de tokens directamente en MetaMask.

### 4. Flujo de Usuario
1. **Conectar wallet** en la DApp
2. **Obtener tokens** (faucet o despliegue)
3. **Depositar colateral** (cUSD)
4. **Pedir préstamo** (hasta 66% del colateral)
5. **Gestionar posición** (ver métricas en dashboard)
6. **Pagar préstamo** (capital + interés)
7. **Retirar colateral** (cuando no hay deuda)

### 5. Ejemplo de Uso con 100 cUSD
- **Obtener tokens**: Usa el faucet para obtener 100 cUSD y 100 dDAI
- **Depositar**: 100 cUSD como colateral
- **Pedir prestado**: Hasta 66 dDAI (66% del colateral)
- **Interés**: 5% semanal = 3.3 dDAI
- **Total a pagar**: 69.3 dDAI (66 + 3.3)
- **Ratio de colateralización**: 151.5% (100/66)

> **💡 Tip:** El sistema incluye verificaciones automáticas de balance y aprobación de tokens para facilitar el proceso de pago.

### 6. Características del Dashboard
- Métricas en tiempo real
- Factor de salud con alertas
- Cálculos automáticos de límites
- Historial visual de transacciones

## 🎯 Próximas Mejoras

- [ ] Modo claro/oscuro toggle
- [ ] Gráficos de métricas históricas
- [ ] Múltiples tokens de colateral
- [ ] Liquidaciones automáticas
- [ ] Gobernanza descentralizada
- [ ] Tests de integración frontend-backend

## 📄 Documentación Adicional

- [Frontend README](web_app/README.md) - Documentación detallada del frontend
- [Scripts README](scripts/README.md) - Documentación de scripts y automatización

## 🤝 Contribución

Este es un proyecto educativo del curso de Blockchain. Las contribuciones son bienvenidas:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📜 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles.

## 🎓 Contexto Académico

Proyecto final para:
- **Asignatura**: Blockchain
- **Institución**: FPUNA
- **Semestre**: 8° Semestre
- **Año**: 2025
