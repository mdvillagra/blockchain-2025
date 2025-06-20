# Lending DApp – Examen Final de Blockchain

## 🧠 Descripción del proyecto

Esta DApp (Decentralized Application) implementa un **protocolo de préstamos con colateral** en la blockchain. El sistema permite a un usuario:

- Depositar tokens como garantía (colateral)
- Solicitar préstamos de hasta el 50% del colateral depositado
- Repagar el préstamo con un interés del 5%
- Retirar el colateral una vez cancelada la deuda

Todo el backend fue programado con **Solidity**, desplegado en la testnet **Alfajores** (Celo) usando **Hardhat**, y el frontend fue desarrollado en **React**, integrando **ethers.js** para interactuar con los contratos inteligentes.

---

## 🔍 Funcionalidades

| Función              | Estado     |
|----------------------|------------|
| Conexión con Metamask | ✅          |
| Depositar colateral  | ✅          |
| Pedir préstamo       | ✅          |
| Repagar préstamo     | ✅          |
| Retirar colateral    | ✅          |
| Mostrar saldos       | ✅          |

---

## ⚙️ Stack tecnológico

- Solidity
- Hardhat
- React.js
- Ethers.js v6
- Metamask
- Testnet: **Alfajores** (Celo)

---

## 📦 Contratos desplegados

- **CollateralToken**: `0x3D2ca253f2e58e138Da432dc7aED1b77c2021143`
- **LoanToken**: `0x13D1FAACde3477d5D6a20a6b466261b1Bd528da9`
- **LendingProtocol**: `0x4d370733441E86B4EDFC18135858C76a2a9Ac7b6`

---

## 🚫 ¿Por qué no se utilizó la red Ephemery?

Inicialmente se intentó trabajar con la red **Ephemery Testnet**, sin embargo se presentaron diversos problemas:

- ❌ El **faucet oficial estaba caído** (`https://faucet.ephemery.dev`, `502 Bad Gateway`)
- ❌ No era posible fondear cuentas con ETH para gas.
- ❌ El endpoint `https://rpc.ephemery.dev` no respondía consistentemente o daba errores SSL (`certificate expired`)
- ❌ La conexión con Metamask no era estable y muchas veces no se reconocía la red.

> 🔄 Por lo tanto, se optó por **migrar a la testnet Alfajores**, una red activa, estable y con faucet funcional, asegurando el correcto despliegue, interacción y evaluación del proyecto.

---

## 🧪 Pruebas realizadas

1. ✅ Se conectó Metamask a la DApp
2. ✅ Se depositaron 100 tokens como colateral
3. ✅ Se solicitó un préstamo de 50 tokens
4. ✅ Se repagaron 50 tokens + 5% de interés (2.5 tokens)
5. ✅ Se retiró el colateral al finalizar el préstamo
6. ✅ Se comprobó la actualización de saldos en la interfaz

---

## ▶️ Cómo ejecutar el proyecto localmente

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd lending-dapp

# 2. Instalar dependencias
npm install

# 3. Compilar los contratos
npx hardhat compile

# 4. Desplegar tokens y protocolo en Alfajores
npx hardhat run scripts/deploy_tokens.js --network alfajores
npx hardhat run scripts/deploy.js --network alfajores

# 5. Ejecutar el frontend
cd frontend
npm install
npm run dev

