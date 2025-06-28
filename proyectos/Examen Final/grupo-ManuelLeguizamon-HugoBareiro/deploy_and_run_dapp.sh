#!/bin/bash

# --- Configuración ---
# Estas rutas son relativas al directorio donde se ejecuta este script (blockFinal/)
HARDHAT_PROJECT_DIR="." # El proyecto Hardhat está en el directorio actual (blockFinal)
FRONTEND_PROJECT_DIR="my-dapp-frontend"
NETWORK="holesky" 
FRONTEND_CONTRACTS_PATH="${FRONTEND_PROJECT_DIR}/src/contracts"

echo "Iniciando el proceso de despliegue y lanzamiento de la dApp..."

# --- Paso 1: Instalando dependencias de Hardhat ---
# No es necesario hacer cd, ya estamos en el directorio raíz de Hardhat (blockFinal)
echo ""
echo "--- Paso 1: Instalando dependencias de Hardhat ---"
npm install
npm audit fix --force

# --- Paso 2: Compilar contratos ---
echo ""
echo "--- Paso 2: Compilando contratos de Hardhat ---"
npx hardhat compile

# --- Paso 3: Desplegar contratos en la red especificada ---
echo ""
echo "--- Paso 3: Desplegando contratos en la red ${NETWORK} ---"
npx hardhat run scripts/deploy.js --network "$NETWORK"

# Verificar si el despliegue fue exitoso
if [ $? -ne 0 ]; then
    echo "Error: El despliegue de los contratos falló. Saliendo."
    exit 1
fi

echo "Despliegue de contratos completado. ABIs y direcciones deberían estar en ${FRONTEND_CONTRACTS_PATH}."

# --- Paso 4: Preparando el Front-end ---
echo ""
echo "--- Paso 4: Preparando el Front-end ---"

# Verificar si el directorio del front-end existe
if [ ! -d "$FRONTEND_PROJECT_DIR" ]; then
    echo "Error: No se encontró el directorio del front-end (${FRONTEND_PROJECT_DIR}). Saliendo."
    exit 1
fi

cd "$FRONTEND_PROJECT_DIR"

# Instalar dependencias del front-end (si no están ya instaladas)
echo "Instalando dependencias de React..."
npm install

# --- Paso 5: Iniciar el servidor de desarrollo de React ---
echo ""
echo "--- Paso 5: Iniciando el servidor de desarrollo de React ---"
echo "Abre tu navegador en http://localhost:3000 (o el puerto indicado) una vez que el servidor inicie."
npm start

echo "Proceso completado. La dApp debería estar ejecutándose."