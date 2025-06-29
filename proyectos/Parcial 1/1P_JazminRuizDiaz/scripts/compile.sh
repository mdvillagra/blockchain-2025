#!/bin/bash
echo "Compilando circuito..."

mkdir -p circuit/compiled

circom circuit/circuit.circom --r1cs --wasm -o circuit/compiled -l node_modules

for inputFile in circuit/inputs/*.json; do
    filename=$(basename -- "$inputFile" .json)

    if node circuit/compiled/circuit_js/generate_witness.js circuit/compiled/circuit_js/circuit.wasm "$inputFile" "circuit/compiled/${filename}_witness.wtns" 2>/dev/null; then
        echo "Witness generado para $filename."
    else
        echo "ERROR en $filename: El input no cumple con las restricciones del circuito."
    fi
done
