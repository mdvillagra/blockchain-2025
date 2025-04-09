#!/bin/bash
echo "Trusted setup..."

# Verificar si el archivo PTAU existe
if [ ! -f pot12_final.ptau ]; then
    echo "Descargando pot12_final.ptau..."
    wget -q https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau -O pot12_final.ptau
fi

snarkjs groth16 setup circuit/compiled/circuit.r1cs pot12_final.ptau circuit/compiled/circuit.zkey

echo "Exportando verification key..."
snarkjs zkey export verificationkey circuit/compiled/circuit.zkey circuit/compiled/verification_key.json