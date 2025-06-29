Proyecto Final: Protocolo de Préstamos Descentralizados

Integrantes:    Marcelo Andre Pauls Toews, 
                Andres Roman Medina

Este proyecto es una aplicación descentralizada (DApp) para la asignatura de Blockchain. Consiste en un protocolo de préstamos que permite a los usuarios depositar un token colateral (cUSD) para solicitar préstamos en otro token (dDAI), pagar su deuda con un interés fijo y retirar su colateral.

El sistema opera en la red de pruebas configurada (ej. Sepolia) sin depender de oráculos de precios externos ni de liquidadores automáticos. El ratio de precios entre los tokens es fijo (1 cUSD = 1 dDAI).

Funcionalidad Principal

    Depósito de Colateral: Los usuarios pueden depositar tokens (cUSD) como garantía para sus préstamos.

Solicitud de Préstamo: Se pueden solicitar préstamos en otro token (dDAI) con un ratio de colateralización del 150%.

Repago de Deuda: Los usuarios pueden pagar el total de su préstamo con un interés fijo del 5% semanal.

Retiro de Colateral: Una vez que la deuda ha sido saldada por completo, los usuarios pueden retirar su colateral.

Tecnología Utilizada

    Smart Contracts: Solidity

    Entorno de Desarrollo: Hardhat 

Librerías Frontend: Ethers.js, React, Vite 

Pruebas: Chai, Hardhat Toolbox 

Cobertura de Código: solidity-coverage 

Billetera: MetaMask 

Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

    Node.js (v18.x o superior)

    npm (generalmente se instala con Node.js)

    Una billetera de navegador como MetaMask

Configuración del Entorno

Para ejecutar este proyecto localmente, es necesario configurar las variables de entorno.

    Crea un archivo llamado .env en la raíz del proyecto.

    Añade las siguientes variables al archivo .env, reemplazando los valores de ejemplo con tus propias claves:

    # URL del proveedor RPC para la red de pruebas (ej. Sepolia)
    VITE_RPC_URL="Tu_URL_RPC_de_Alchemy_o_Infura"

    # La clave privada de la cuenta de MetaMask que usarás para el despliegue.
    # IMPORTANTE: Usa una cuenta de desarrollo, NUNCA una con fondos reales.
    PRIVATE_KEY="Tu_Clave_Privada_de_MetaMask"

    # Dirección del contrato principal después del despliegue (se puede dejar en blanco inicialmente)
    VITE_CONTRACT_ADDRESS=""

    Advertencia de Seguridad: El archivo .env nunca debe ser subido a repositorios públicos. Asegúrate de que tu archivo .gitignore contenga una línea con .env.

Instalación

Clona el repositorio y navega a la raíz del proyecto. Luego, instala todas las dependencias necesarias:
Bash

npm install

Comandos Principales

A continuación se detallan los comandos principales para compilar, probar y desplegar el proyecto.

Compilación de Contratos

Este comando compila los contratos de Solidity y genera los ABIs necesarios para la interacción.
Bash

npx hardhat compile

Ejecución de Pruebas Unitarias

Ejecuta la suite de tests ubicada en la carpeta 

test/ para verificar la lógica de los contratos.

Bash

npx hardhat test

Medición de Cobertura de Pruebas

Genera un reporte en la terminal que muestra el porcentaje de cobertura de líneas de los tests sobre los contratos de Solidity.

Bash

npm run coverage

Despliegue en la Red de Pruebas

Este script despliega todos los contratos en la red configurada (ej. Sepolia) y guarda automáticamente las direcciones de los contratos en el archivo 

web_app/src/deployment-addresses.json para que el frontend pueda usarlas.

Bash

npx hardhat run scripts/deploy.js --network sepolia

Uso de la Aplicación

Iniciar el Frontend

Para iniciar la aplicación web en un servidor de desarrollo local:

    Navega a la carpeta del frontend (web_app/).

    Si es la primera vez, instala sus dependencias: npm install

    Inicia la aplicación: npm run dev

Luego, abre la URL local que aparece en la terminal en tu navegador.

Acuñar Tokens (Tareas Administrativas)

Para poder probar la DApp, necesitas tokens cUSD (para depositar) y dDAI (para pagar deudas). El proyecto incluye una tarea de Hardhat para acuñar (mint) estos tokens. La cuenta que ejecuta esta tarea debe ser la misma que desplegó los contratos (el 
owner).

La sintaxis del comando es la siguiente:
Bash

npx hardhat mint --network sepolia --token <simbolo> --to <direccion> --amount <cantidad>

Ejemplos de uso:

    Acuñar 1000 cUSD a tu propia billetera:
    Bash

npx hardhat mint --network sepolia --token cusd --to 0xTU_DIRECCION_DE_METAMASK --amount 1000

Acuñar 500 dDAI a tu propia billetera (para probar el repago):
Bash

    npx hardhat mint --network sepolia --token ddai --to 0xTU_DIRECCION_DE_METAMASK --amount 500

Dirección del Contrato Principal Desplegado
La direcciónes son:

CollateralToken: 0x06c23545742A870F29838EB8D08Ef16Af119A605
LoanToken:       0x364070a59976E27d83481493e43215CF02EbB0d3
LendingProtocol: 0xb97E90d62c2dbAC861F596600863911c1dFD3435