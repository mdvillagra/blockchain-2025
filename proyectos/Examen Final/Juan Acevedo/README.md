# 🏦 Lending DApp - Préstamos Descentralizados con Colateral

Este proyecto es una aplicación descentralizada (DApp) que permite a los usuarios:

- Depositar tokens como colateral (cUSD)
- Solicitar préstamos en otro token (dDAI)
- Pagar su préstamo con interés fijo
- Retirar su colateral una vez pagada la deuda

Todo esto sin oráculos externos ni liquidadores automáticos. El ratio de precios es fijo: **1 cUSD = 1 dDAI**.

---

## 📁 Estructura del Proyecto

```
.
├── smart_contract/    --> Contratos inteligentes y scripts de test/despliegue
└── web_app/           --> Cliente web desarrollado con React + Vite
```

---

## 🚀 1. Probar la Aplicación Web con el Contrato Ya Desplegado

Puedes usar directamente el contrato desplegado y funcional que ya contiene los fondos iniciales.

### 📍 Pasos:

1. Ubícate en el directorio `web_app/`:
   ```bash
   cd web_app
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` con las siguientes variables (Estas direcciones son de contratos ya desplegados por mi con fondos de 1000 dDAI aprox. para dar prestamos):

   ```env
   VITE_LENDING_PROTOCOL_ADDRESS=0x3Ee788322bE73c3A82Ef82828F019F8709ad3A9e
   VITE_COLLATERAL_TOKEN_ADDRESS=0x996B0C6dd5A33DbDe05D54B0C2a7a4db99e1dF03
   VITE_LOAN_TOKEN_ADDRESS=0x6d91AEEc9F430aAFFd921cc0012181551098ddf0
   ```

   ***IMPORTANTE:*** ⚠️ Antes de iniciar la aplicación, debes cargar fondos a tu wallet personal para poder realizar acciones con exito.

   1. Ubicate en `smart_contract/`

      Asegúrate de tener ETH en la red **Hoodi** para cubrir el gas.
      Se puede minar en https://hoodi-faucet.pk910.de/ (aun no demanda un consumo alto)

      Abre los siguientes archivos en `smart_contract/scripts/`:
      - `mintCUSDToUser.js`
      - `mintDDAItoUser.js`

      En cada uno busca la línea:
      ```js
      const user = "0x972829dabC2b673cd54CA86CF8551Ed8D46eF094";
      ```
      Actualmente tiene mi clave, reemplázala por tu **dirección pública de MetaMask** (la que puedes copiar desde la parte superior de MetaMask).  
      ⚠️ No modifiques nada más en esos archivos.

   2. Crea un archivo `.env` con tu clave privada (La configuración de la red lo requiere):
      ```env
      PRIVATE_KEY="tu_clave_privada"
      ```
      
   3. Ejecuta los comandos:
      
      Si aun no lo hiciste, instala las dependencias:
      ```bash
      npm install
      ```
      
      Ejecuta los scripts para la carga de tokens iniciales:
      ```bash
      npx hardhat run scripts/mintCUSDToUser.js --network hoodi
      npx hardhat run scripts/mintDDAItoUser.js --network hoodi
      ```

      - El primer script carga **100 cUSD** a tu wallet para que puedas **depositar colateral**.
      - El segundo script carga **100 dDAI** a tu wallet para que puedas **pagar tus préstamos**.

4. Inicia la aplicación:
   ```bash
   npm run dev
   ```

---

## 🧪 2. Ejecutar los Tests de los Contratos

### 📍 Pasos:

1. Ve al directorio `smart_contract/`:
   ```bash
   cd smart_contract
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```
   
3. Crea un archivo `.env` con tu clave privada (La configuración de la red lo requiere):

   ```env
   PRIVATE_KEY="tu_clave_privada"
   ```

4. Ejecuta los tests:
   ```bash
   npx hardhat test
   ```

5. Verifica la cobertura:
   ```bash
   npx hardhat coverage
   ```

> ℹ️ El contrato `FailingTransfer.sol` (en `contracts/test/`) solo se usa para tests y **no se despliega**.

---

## 🔧 3. Desplegar Nuevamente los Contratos

Si quieres desplegar una nueva instancia del contrato:

### 📍 Pasos:

1. Ve al directorio `smart_contract/`:
   ```bash
   cd smart_contract
   ```

2. Crea un archivo `.env` con tu clave privada:

   ```env
   PRIVATE_KEY="tu_clave_privada"
   ```

3. Asegúrate de tener ETH en la red **Hoodi** para cubrir el gas.
   Se puede minar en https://hoodi-faucet.pk910.de/ (aun no demanda un consumo alto).


4. Instala las dependencias:
   ```bash
   npm install
   ```

5. Ejecuta el despliegue:
   ```bash
   npx hardhat run deploy.js --network hoodi
   ```

6. Copia las 3 direcciones mostradas al desplegar y colócalas en el archivo `.env` dentro del directorio `web_app/`:
   ```env
   VITE_LENDING_PROTOCOL_ADDRESS=0x...
   VITE_COLLATERAL_TOKEN_ADDRESS=0x...
   VITE_LOAN_TOKEN_ADDRESS=0x...
   ```

7. Carga los tokens necesarios con los siguientes comandos:

   📌 **Importante**:
      - Los 3 .js en scripts/ contienen las direcciones de los contratos y de la wallet, actualmente las que yo cargué.
      Debes actualizar en estos .js algunos const:

        1- `mintDDAItoContract.js`

         LOAN_TOKEN_ADDRESS = con el nuevo VITE_LOAN_TOKEN_ADDRESS del .env
         
         LENDING_PROTOCOL_ADDRESS = con el nuevo VITE_LENDING_PROTOCOL_ADDRESS del .env

         2- `mintCUSDToUser.js`

         COLLATERAL_TOKEN_ADDRESS = con el nuevo VITE_COLLATERAL_TOKEN_ADDRESS del .env
         
         user = con la direccion de tu wallet

         3- `mintDDAItoUser.js`

         user = con la direccion de tu wallet
         
         LOAN_TOKEN_ADDRESS = con el nuevo VITE_LOAN_TOKEN_ADDRESS del .env

      ```bash
      # 1. Carga 1000 dDAI al contrato para que pueda otorgar préstamos
      npx hardhat run scripts/mintDDAItoContract.js --network hoodi

      # 2. Carga 100 cUSD al usuario configurado para que pueda depositar colateral
      npx hardhat run scripts/mintCUSDToUser.js --network hoodi

      # 3. Carga 100 dDAI al usuario configurado para que pueda repagar préstamos
      npx hardhat run scripts/mintDDAItoUser.js --network hoodi
      ```

---

## 🧠 Detalles Técnicos

- Tokens:
  - `CollateralToken` (cUSD)
  - `LoanToken` (dDAI)

---

## ✅ Funcionalidades Soportadas

- Conectar MetaMask
- Mostrar colateral, deuda e interés
- Depositar cUSD como colateral
- Solicitar préstamos en dDAI
- Pagar préstamos
- Retirar colateral

---

## 🧪 Tests y Cobertura

Los tests cubren:

- Depósitos
- Solicitud y validación de préstamos
- Pagos e intereses
- Retiros de colateral
- Casos de error y validaciones

✔️ **Cobertura total con `hardhat coverage`**
