#!/bin/bash
echo "Verificando prueba..."

for proofFile in circuit/proofs/*_proof.json; do
    filename=$(basename -- "$proofFile" _proof.json)
    snarkjs groth16 verify circuit/compiled/verification_key.json "circuit/proofs/${filename}_public.json" "$proofFile"
    echo "Verificación completada para $filename."
done