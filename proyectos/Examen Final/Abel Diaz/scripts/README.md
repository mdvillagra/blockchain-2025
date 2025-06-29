# Scripts del Proyecto

Este directorio contiene scripts útiles para el desarrollo y despliegue del protocolo DeFi Lend.

## 📄 Scripts Disponibles

### `deploy.js`
Script principal para desplegar los contratos en la red Ephemery.

**Uso:**
```bash
npm run deploy
# o directamente:
npx hardhat run scripts/deploy.js --network ephemery
```

### `copyAbi.js`
Copia automáticamente los ABIs compilados al frontend, extrayendo solo la información necesaria.

**Uso:**
```bash
npm run copy-abi
# o directamente:
node scripts/copyAbi.js
```

**Qué hace:**
- Crea la carpeta `web_app/src/abi/` si no existe
- Copia los ABIs de `LendingProtocol`, `CollateralToken` y `LoanToken`
- Extrae solo el ABI, bytecode y datos relevantes
- Crea un archivo `index.js` para facilitar las importaciones

### `post-compile.js`
Se ejecuta automáticamente después de compilar para mantener los ABIs actualizados.

**Uso:**
```bash
node scripts/post-compile.js
```

## 🚀 Flujo de Desarrollo Recomendado

### Desarrollo Inicial
1. **Setup completo**
   ```bash
   npm run setup  # Instala todas las dependencias
   ```

2. **Primera compilación**
   ```bash
   npm run build-contracts  # Limpia + compila + copia ABIs
   ```

3. **Desarrollo del frontend**
   ```bash
   npm run start-app  # Inicia desde raíz del proyecto
   ```

### Desarrollo Iterativo
1. **Modificar contratos**
   ```bash
   # Editar archivos .sol
   ```

2. **Compilación rápida**
   ```bash
   npm run build  # Compila + copia ABIs (sin limpiar)
   ```

3. **Si hay problemas de cache**
   ```bash
   npm run build-contracts  # Limpieza completa
   ```

### Despliegue
```bash
npm run deploy  # Despliega a Ephemery
# ⚠️ IMPORTANTE: Actualizar direcciones VITE_* en .env (raíz del proyecto)
```

## 📁 Estructura de ABIs Generada

```
web_app/src/abi/
├── LendingProtocol.json
├── CollateralToken.json
├── LoanToken.json
└── index.js
```

### Formato de cada ABI:
```json
{
  "contractName": "LendingProtocol",
  "abi": [...],
  "bytecode": "0x...",
  "deployedBytecode": "0x..."
}
```

### Importación en el frontend:
```javascript
import { LendingProtocolABI, CollateralTokenABI, getABI } from './abi'

// Usar el ABI
const abi = getABI(LendingProtocolABI)
const contract = new ethers.Contract(address, abi, signer)
```

## 🔧 Configuración

### Variables de Entorno Requeridas

**Archivo único .env en la raíz del proyecto:**
- `PRIVATE_KEY`: Clave privada para el despliegue (Hardhat)
- `VITE_LENDING_PROTOCOL_ADDRESS`: Dirección del contrato principal (Frontend)
- `VITE_COLLATERAL_TOKEN_ADDRESS`: Dirección del token cUSD (Frontend)
- `VITE_LOAN_TOKEN_ADDRESS`: Dirección del token dDAI (Frontend)
- `VITE_RPC_URL`: URL RPC de Ephemery (Hardhat + Frontend)

### Scripts npm

```json
{
  "setup": "npm install && cd web_app && npm install",
  "clean": "npx hardhat clean",
  "compile": "hardhat compile", 
  "copy-abi": "node scripts/copyAbi.js",
  "build": "npm run compile && npm run copy-abi",
  "build-contracts": "npm run clean && npx hardhat compile && npm run copy-abi",
  "start-app": "npm --prefix web_app run dev",
  "dev:frontend": "cd web_app && npm run dev",
  "deploy": "hardhat run scripts/deploy.js --network ephemery",
  "test": "hardhat test",
  "coverage": "hardhat coverage"
}
```

## 🐛 Solución de Problemas

### Error: "ABIs no encontrados"
```bash
# Compilar y copiar ABIs manualmente
npm run compile
npm run copy-abi
```

### Error: "Cannot find module './abi'"
- Asegúrate de haber ejecutado `npm run copy-abi`
- Verifica que existe la carpeta `web_app/src/abi/`

### Error en el despliegue
- Verifica que tengas ETH en tu wallet para gas
- Confirma que la variable `PRIVATE_KEY` esté configurada
- Asegúrate de estar en la red Ephemery correcta

## 🔄 Automatización

El flujo está diseñado para ser automático:

1. **Cambio en contratos** → `npm run build` → ABIs actualizados
2. **Cambio en ABIs** → Frontend usa automáticamente las nuevas versiones
3. **Despliegue** → Actualizar `.env` con nuevas direcciones

## 📝 Próximas Mejoras

- [ ] Script para verificar contratos en Ephemery
- [ ] Script para generar tipos TypeScript desde ABIs
- [ ] Script para ejecutar tests de integración frontend-backend
- [ ] Automatización de deployment con CI/CD 