#!/bin/bash

# Variables
CIRCUIT_DIR="../Circuito"
SCRIPT_DIR=$(pwd)
OUTPUT_DIR="${CIRCUIT_DIR}/out"
CIRCUIT_NAME="circuito_principal"

# Crear directorio de salida si no existe
mkdir -p $OUTPUT_DIR

# Compilar el circuito
echo "Compilando circuito..."
circom2 $CIRCUIT_DIR/$CIRCUIT_NAME.circom --r1cs --wasm --sym -o $OUTPUT_DIR

# Mostrar información del circuito
echo "Información del circuito:"
npx snarkjs info -r $OUTPUT_DIR/$CIRCUIT_NAME.r1cs

# Copiar input.json al directorio de salida si existe
if [ -f "$CIRCUIT_DIR/input.json" ]; then
    cp $CIRCUIT_DIR/input.json $OUTPUT_DIR/$CIRCUIT_NAME"_js"
fi

echo "Compilación completada. Los archivos se encuentran en: $OUTPUT_DIR"