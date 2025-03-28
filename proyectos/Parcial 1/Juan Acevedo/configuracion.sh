#!/bin/bash

# Script para configuración inicial de proyecto snarkjs
set -e # Detiene el script al primer error

echo "🚀 Iniciando configuración del proyecto..."

echo "1. Compilando circuito corto.circom..."
circom corto.circom --r1cs --wasm --sym || {
    echo "❌ Error al compilar el circuito";
    exit 1;
}

echo "2. Descargando archivo ptau (esto puede tardar)..."
wget https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_10.ptau -O contribuido.ptau || {
    echo "❌ Error al descargar el archivo ptau";
    exit 1;
}

echo "3. Generando claves zKey..."
snarkjs groth16 setup corto.r1cs contribuido.ptau claves.zkey || {
    echo "❌ Error al generar las claves";
    exit 1;
}

echo "4. Exportando clave de verificación..."
snarkjs zkey export verificationkey claves.zkey claves.json || {
    echo "❌ Error al exportar verification key";
    exit 1;
}

echo "✅ Configuración completada exitosamente!"
