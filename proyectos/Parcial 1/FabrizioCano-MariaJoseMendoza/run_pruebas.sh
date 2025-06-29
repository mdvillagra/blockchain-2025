#!/bin/bash

# Procesar múltiples inputs ---
INPUT_FILES=("../input1.json" "../input2.json") 

for INPUT_FILE in "${INPUT_FILES[@]}"; do
    # Extrae el nombre base sin extensión
    BASE_NAME=$(basename "$INPUT_FILE" .json)
    
    echo "Processing $INPUT_FILE..."
    
    # Generar witness y prueba
    node ../circuito_js/generate_witness.js ../circuito_js/circuito.wasm "$INPUT_FILE" ../witness.wtns
    snarkjs groth16 prove circuito_0001.zkey ../witness.wtns "../proof_${BASE_NAME}.json" "../public_${BASE_NAME}.json"

    # Verificar
    snarkjs groth16 verify verification_key.json "../public_${BASE_NAME}.json" "../proof_${BASE_NAME}.json"
done

echo "Todas las pruebas fueron completadas con éxito."