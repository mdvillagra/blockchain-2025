
# Protocolo de Préstamos Descentralizado (dApp)

Este proyecto es una implementación de un protocolo de préstamos descentralizado básico, diseñado para operar en la blockchain. Permite a los usuarios interactuar con contratos inteligentes para gestionar colateral y obtener préstamos.

## 🚀 Características Clave

* **Contratos Inteligentes (Solidity)**:
    * `LendingProtocol.sol`: El cerebro del protocolo, maneja la lógica central de depósitos, préstamos y repagos.
    * `CollateralToken.sol`: Un token ERC-20 simulado denominado `cUSD`, que sirve como colateral para los préstamos.
    * `LoanToken.sol`: Un token ERC-20 simulado denominado `dDAI`, que es el activo que se presta a los usuarios.
* **Funcionalidades del Protocolo**:
    * **Depósito de Colateral**: Los usuarios pueden bloquear tokens `cUSD` como garantía.
    * **Préstamos**: Permite a los usuarios solicitar `dDAI` basándose en el valor de su colateral, aplicando límites de colateralización predefinidos.
    * **Repago de Préstamo**: Los usuarios pueden liquidar su deuda de `dDAI`, incluyendo los intereses acumulados.
    * **Retiro de Colateral**: El colateral solo puede ser retirado si el usuario no mantiene un préstamo activo.
    * **Cálculo de Intereses**: El protocolo incorpora un mecanismo de interés fijo.
* **Interfaz de Usuario (Front-end React)**:
    * **Conectividad**: Se integra con MetaMask para una interacción fluida con la blockchain.
    * **Visualización de Datos**: Muestra el balance de tokens (`cUSD`, `dDAI`), el colateral depositado, la deuda actual y los intereses generados por el usuario.
    * **Interacción Directa**: Incluye formularios intuitivos para ejecutar las operaciones de depósito, préstamo, repago y retiro de fondos.

## 🛠️ Tecnologías Empleadas

* **Solidity**: Lenguaje de programación para contratos inteligentes.
* **Hardhat**: Entorno de desarrollo para la compilación, despliegue y realización de pruebas de contratos inteligentes.
* **Ethers.js**: Una librería JavaScript esencial para interactuar con la blockchain.
* **React**: Un framework de JavaScript utilizado para construir la interfaz de usuario dinámica y responsiva.
* **MetaMask**: Una extensión de navegador indispensable para la gestión de carteras de criptomonedas y la interacción con dApps.
* **Red de Prueba Holesky (o Sepolia)**: Utilizada para el despliegue y las pruebas de los contratos en un entorno de blockchain de prueba.

## 📂 Estructura del Proyecto

blockFinal/
├── artifacts/              # Contiene los artefactos de contratos compilados (ABIs y bytecode).
├── cache/                  # Directorio de caché de Hardhat.
├── contracts/              # Ubicación de los archivos fuente de los contratos Solidity.
│   ├── CollateralToken.sol
│   ├── LendingProtocol.sol
│   └── LoanToken.sol
├── my-dapp-frontend/       # La raíz del proyecto React para la interfaz de usuario.
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.js          # Contiene la lógica principal de la aplicación descentralizada.
│   │   ├── index.js
│   │   └── contracts/      # Directorio donde se copian los ABIs y las direcciones de los contratos desplegados.
│   │       ├── CollateralToken.json
│   │       ├── LendingProtocol.json
│   │       ├── LoanToken.json
│   │       └── contract-addresses.json
│   ├── .env                # Archivo para variables de entorno específicas del front-end (opcional).
│   ├── package.json
│   └── ...otros archivos de React
├── node_modules/           # Módulos y dependencias de Node.js para Hardhat.
├── scripts/                # Scripts de Hardhat, como el script de despliegue (deploy.js).
│   └── deploy.js
├── test/                   # Contiene las pruebas unitarias para los contratos inteligentes.
├── web_app/                # (Si tu front-end principal está aquí, se ajustarían las rutas correspondientes).
├── .env                    # Variables de entorno para Hardhat (ej. claves API, URLs RPC).
├── hardhat.config.js       # Archivo de configuración de Hardhat.
├── package-lock.json
└── package.json

## ⚙️ Configuración y Ejecución

### Requisitos Previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas:

* **Node.js**: Versión 16.x o superior [enlace a Node.js](https://nodejs.org/en/).
* **npm**: Se instala automáticamente con Node.js [enlace a npm](https://www.npmjs.com/get-npm).
* **MetaMask**: Una extensión esencial para tu navegador web [enlace a MetaMask](https://metamask.io/).
* **Configuración de Red en MetaMask**: Asegúrate de que MetaMask esté configurado para la red de prueba **Holesky** (o Sepolia, si fue la red de tu elección). Si Holesky no aparece en tu lista, puedes añadirla manualmente:
    * **Network name**: Holesky
    * **New RPC URL**: `https://holesky.public.blastapi.io` (o un RPC alternativo fiable)
    * **Chain ID**: `17000`
    * **Currency symbol**: `ETH`
    * **Block explorer URL (opcional)**: `https://holesky.etherscan.io`

### 🚀 Despliegue de Contratos y Lanzamiento del Front-end

El proyecto incluye un script de automatización (`deploy_and_run_dapp.sh`) para simplificar el proceso de despliegue de contratos y el inicio de la aplicación web.

1.  **Configuración de Variables de Entorno para Hardhat**:
    Crea un archivo `.env` en la raíz de tu proyecto (`blockFinal/.env`) y añade tus credenciales:
    ```dotenv
    PRIVATE_KEY="TU_CLAVE_PRIVADA_DE_METAMASK_CON_FONDOS_EN_HOLESKY"
    HOLESKY_RPC_URL="TU_URL_RPC_DE_HOLESKY_EJ_[https://holesky.public.blastapi.io](https://holesky.public.blastapi.io)"
    # Si usaste Sepolia, sería: SEPOLIA_RPC_URL="TU_URL_RPC_DE_SEPOLIA"
    ```
    **⚠️ Advertencia**: **NUNCA** uses una clave privada de una cuenta con fondos reales en entornos de desarrollo o prueba. Utiliza siempre una cuenta de prueba dedicada.

2.  **Ejecutar el Script Automatizado**:
    Abre tu terminal, navega al directorio raíz de tu proyecto (la carpeta `blockFinal/`) y ejecuta los siguientes comandos:

    ```bash
    chmod +x deploy_and_run_dapp.sh # Otorga permisos de ejecución (solo la primera vez)
    ./deploy_and_run_dapp.sh
    ```