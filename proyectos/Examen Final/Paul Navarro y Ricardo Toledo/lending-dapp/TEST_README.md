# Tests del Protocolo de Lending

Este directorio contiene una suite completa de tests para el protocolo de lending, incluyendo tests unitarios para cada contrato y tests de integración para el flujo completo del protocolo.

## Estructura de Tests

### Tests Unitarios

#### `CollateralToken.test.js`
Tests para el token de colateral (cUSD):
- **Deployment**: Verificación de nombre, símbolo, decimales y suministro inicial
- **Minting**: Funcionalidad de acuñación de tokens
- **Transfers**: Transferencias entre usuarios
- **Allowances**: Sistema de aprobaciones para gastadores
- **Casos edge**: Manejo de cantidades grandes, múltiples aprobaciones, etc.

#### `LoanToken.test.js`
Tests para el token de deuda (dDAI):
- **Deployment**: Verificación de nombre, símbolo, decimales y suministro inicial
- **Minting**: Funcionalidad de acuñación de tokens
- **Transfers**: Transferencias entre usuarios
- **Allowances**: Sistema de aprobaciones para gastadores
- **Casos edge**: Manejo de cantidades grandes, múltiples aprobaciones, etc.

#### `LendingProtocol.test.js`
Tests para el contrato principal del protocolo:
- **Deployment**: Verificación de direcciones de tokens, tasas de interés y ratios
- **depositCollateral**: Funcionalidad de depósito de colateral
- **borrow**: Funcionalidad de préstamos con validaciones de límites
- **repay**: Funcionalidad de pago de deudas con intereses
- **withdrawCollateral**: Funcionalidad de retiro de colateral
- **getUserData**: Obtención de datos del usuario
- **Casos edge y seguridad**: Manejo de casos límite y validaciones de seguridad

### Tests de Integración

#### `Integration.test.js`
Tests que verifican el funcionamiento completo del protocolo:
- **Flujo completo de lending**: Depósito → préstamo → pago → retiro
- **Múltiples usuarios**: Interacción simultánea de varios usuarios
- **Casos de límites**: Préstamos al límite máximo y validaciones
- **Manejo de errores**: Casos de error y validaciones
- **Estados del protocolo**: Verificación del estado después de múltiples operaciones

## Ejecución de Tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests específicos
```bash
# Tests del CollateralToken
npx hardhat test test/CollateralToken.test.js

# Tests del LoanToken
npx hardhat test test/LoanToken.test.js

# Tests del LendingProtocol
npx hardhat test test/LendingProtocol.test.js

# Tests de integración
npx hardhat test test/Integration.test.js
```

### Ejecutar tests con reporte detallado
```bash
npx hardhat test --verbose
```

### Ejecutar tests con coverage
```bash
npx hardhat coverage
```

## Configuración de Tests

Los tests utilizan:
- **Hardhat**: Framework de desarrollo y testing
- **Chai**: Biblioteca de aserciones
- **Ethers.js v6**: Para interactuar con los contratos
- **@nomicfoundation/hardhat-toolbox**: Herramientas adicionales de testing

### Configuración en `hardhat.config.js`
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      // Configuración para tests locales
    }
  }
};
```

## Casos de Test Cubiertos

### Funcionalidad Básica
- ✅ Deploy de contratos
- ✅ Configuración inicial de parámetros
- ✅ Operaciones básicas de tokens (mint, transfer, approve)

### Protocolo de Lending
- ✅ Depósito de colateral
- ✅ Préstamos dentro de límites
- ✅ Cálculo correcto de intereses (5%)
- ✅ Pago de deudas
- ✅ Retiro de colateral
- ✅ Validaciones de límites de préstamo (150% ratio de colateralización)

### Seguridad y Validaciones
- ✅ Prevención de préstamos sin colateral
- ✅ Prevención de retiros con deuda pendiente
- ✅ Validaciones de balances insuficientes
- ✅ Validaciones de allowances insuficientes
- ✅ Manejo de direcciones cero

### Casos Edge
- ✅ Cantidades cero
- ✅ Cantidades muy grandes
- ✅ Múltiples operaciones del mismo usuario
- ✅ Interacción de múltiples usuarios
- ✅ Préstamos al límite máximo

## Interpretación de Resultados

### Tests Exitosos
- ✅ Todos los tests deberían pasar sin errores
- ✅ Los tiempos de ejecución deberían ser razonables (< 30 segundos para toda la suite)

### Errores Comunes
- **"Exceeds borrowing limit"**: El usuario intentó pedir más de lo permitido por el ratio de colateralización
- **"Debt outstanding"**: El usuario intentó retirar colateral con deuda pendiente
- **"ERC20InsufficientBalance"**: El usuario no tiene suficientes tokens
- **"ERC20InsufficientAllowance"**: El usuario no ha aprobado suficientes tokens

### Debugging
Para debuggear tests fallidos:
1. Revisar los mensajes de error específicos
2. Verificar las cantidades y cálculos en el test
3. Comprobar que los contratos están correctamente deployados
4. Verificar que las direcciones de los contratos son correctas

## Mantenimiento de Tests

### Agregar Nuevos Tests
1. Crear un nuevo archivo `.test.js` en el directorio `test/`
2. Seguir la estructura de describe/it de Mocha
3. Usar las aserciones de Chai
4. Incluir casos edge y de error

### Actualizar Tests Existentes
1. Mantener la cobertura de funcionalidad
2. Actualizar mensajes de error si cambian los contratos
3. Verificar que los tests siguen siendo relevantes

### Mejores Prácticas
- Usar `beforeEach` para setup común
- Limpiar el estado entre tests
- Usar nombres descriptivos para los tests
- Incluir comentarios explicativos para casos complejos
- Mantener tests independientes entre sí 