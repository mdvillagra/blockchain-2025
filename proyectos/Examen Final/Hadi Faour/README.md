# Protocolo de Préstamos Descentralizado

Este proyecto implementa un protocolo de préstamos basado en contratos inteligentes escritos en Solidity, con una interfaz construida en React. Actualmente, está configurado para ejecutarse y probarse localmente utilizando la red de desarrollo de Hardhat. En caso de querer probar en otra red publica como Ephemery, es neceasrio cambiar el chainID en App.jsx al chainID correcto.

---

## ⚠️ Notas importantes

- Es posible que, tras realizar operaciones (como depósitos o retiros), los **saldos no se actualicen automáticamente**. En ese caso, es recomendable:
  - Desconectar y volver a conectar la billetera

---

## 🛠 Requisitos previos

- Docker y Docker Compose instalados
- MetaMask configurado
- Git

---

## 🐳 Inicialización con Docker

1. Clonar este repositorio:

```bash
git clone https://github.com/tuusuario/tu-repo.git
cd tu-repo
docker compose build
docker compose up
🧪 Configuración del entorno de desarrollo (dentro del contenedor)
docker exec -it contenedor-principal bash
Una vez estés dentro del contenedor (/app), ejecuta los siguientes pasos para preparar el entorno de desarrollo:

1. Inicializar Hardhat y React
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox solidity-coverage @nomicfoundation/hardhat-verify
npm install dotenv @openzeppelin/contracts
npm install create-vite
npx hardhat init  # Seleccionar “Create a basic sample project”
npx create-vite@latest web_app --template react
cd web_app
npm install
npm install ethers @metamask/providers
cd ..
2. Preparar y lanzar la red local
npx hardhat clean
npx hardhat node
🔐 Configuración de MetaMask
Crear una nueva billetera o usar una existente en MetaMask.

Agregar la red local de Hardhat:
Nombre: Hardhat
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Importar una cuenta generada por Hardhat (npx hardhat node muestra varias con sus claves privadas).

Agregar esta cuenta a MetaMask usando la clave privada.

Esta cuenta ya tienen ETH de prueba para interactuar localmente.

🔧 Archivo .env
Ejemplo de .env:
PRIVATE_KEY=TU_CLAVE_PRIVADA(clave privada de la cuenta)
COLLATERAL_TOKEN_ADDRESS=0x...(direccion de cUSD)
LOAN_TOKEN_ADDRESS=0x...(direccion de dDAI)
PROTOCOL_ADDRESS=0x...(direccion del contrato principal)
⚠️ Asegúrate de editar el .env con las direcciones correctas luego de desplegar los contratos.

🚀 Despliegue de Contratos
Desde la raíz del proyecto(app/) (dentro del contenedor):
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
Luego de desplegar, actualiza el archivo .env con las direcciones de los contratos obtenidas.

🪙 Importar tokens a MetaMask
Agrega manualmente los contratos desplegados como tokens personalizados en MetaMask para poder visualizar saldos de colateral y préstamos.

📦 Copiar las ABI para el frontend
estando en app/
cp artifacts/contracts/CollateralToken.sol/CollateralToken.json web_app/src/assets/CollateralTokenABI.json
cp artifacts/contracts/LoanToken.sol/LoanToken.json web_app/src/assets/LoanTokenABI.json
cp artifacts/contracts/LendingProtocol.sol/LendingProtocol.json web_app/src/assets/LendingProtocolABI.json
🌐 Lanzar la aplicación web:
cd web_app
npm run dev -- --host 0.0.0.0
La aplicación quedará disponible desde tu navegador en:
http://localhost:3000
✅ Interacción con la dApp
Conectar MetaMask a la red local (Hardhat).

Interactuar con el protocolo desde la interfaz.

Si los saldos no se reflejan correctamente, recuerda:

Desconectar y conectar la billetera con el boton.

🧪 Pruebas
Para ejecutar las pruebas automatizadas con Hardhat:
npx hardhat test
También puedes generar un informe de cobertura:
npx hardhat coverage

📂 Estructura del proyecto
HADI FAOUR/
├── contracts/                # Contratos inteligentes en Solidity
├── scripts/                 # Scripts de despliegue
├── test/                    # Pruebas automatizadas
├── web_app/                 # Aplicación frontend en React
├── .env                     # Variables de entorno
├── Dockerfile               # Configuración de imagen Docker
├── docker-compose.yml       # Orquestación con Docker Compose
└── hardhat.config.js        # Configuración de Hardhat