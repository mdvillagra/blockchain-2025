# DApp de Préstamos Descentralizados

Este mini-proyecto implementa una DApp que permite a los usuarios:

- Depositar tokens como colateral (por ejemplo, cUSD).
- Solicitar préstamos en otro token (por ejemplo, dDAI) con un ratio de colateralización del 150%.
- Pagar su préstamo con un interés fijo y retirar su colateral.
- Todo sin oráculos externos ni liquidadores automáticos.

---

## Tecnologías y herramientas utilizadas

- Solidity 0.8.19
- Hardhat (framework de desarrollo para Ethereum)
- OpenZeppelin Contracts (para tokens ERC20)
- MetaMask (wallet)
- Red Sepolia (testnet Ethereum)
- Infura (como gateway RPC)
- dotenv (para variables de entorno)
- solidity-coverage (para reporte de cobertura)
- Hardhat Toolbox (plugins para testing, ethers, etc.)

---
## Contributors
- Fabrizio Cano
- Maria Jose Mendoza

## Configuración y despliegue

### 1. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
INFURA_API_KEY=api key generada en metamask.dev
PRIVATE_KEY=privatekey de meta mask
```
Obs: Para generar la api key de infura ir a [metamask.dev](https://developer.metamask.io/)

## Configuración de Hardhat (hardhat.config.js)
```node
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");

require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/" + process.env.INFURA_API_KEY,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```
## Despliegue del contrato
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
Esto desplegará los contratos y devolverá las direcciones de los tokens CollateralToken (cUSD), LoanToken (dDAI) y del contrato principal LendingProtocol.

Obs: la direccion del contrato de la dapp elaborada es: 0x95a20d1212495203d97294dBA0aD2c2fc001D7dB
VITE_COLLATERAL_TOKEN_ADDRESS=0xe88176582A943A2941a48E24B06c688a2091b999
VITE_LOAN_TOKEN_ADDRESS=0x92F616F4c27704037be1E08A1ad5583FaeEd817D

## Ejecución de tests
Correr test de contratos:
``npx hardhat test``

Generar reporte de cobertura:
``npx hardhat coverage``

## Red Sepolia en Metamask

Nombre: SepoliaNet
URL RPC: sepolia.infura.io
Simbolo de moneda: ETH

Para obtener faucet ir a: [sepoliafaucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)