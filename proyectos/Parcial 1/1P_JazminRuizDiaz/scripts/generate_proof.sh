#!/bin/bash
echo "Generando prueba..."

mkdir -p circuit/proofs

for witnessFile in circuit/compiled/*_witness.wtns; do
    filename=$(basename -- "$witnessFile" _witness.wtns)
    snarkjs groth16 prove circuit/compiled/circuit.zkey "$witnessFile" "circuit/proofs/${filename}_proof.json" "circuit/proofs/${filename}_public.json"
    echo "Prueba generada para $filename."
done