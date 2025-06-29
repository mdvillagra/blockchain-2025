#!/bin/bash
set -e

echo "Compilando circuito..."
circom circuito.circom --r1cs --wasm --sym -o .

echo "Generando testigo..."
node circuito_js/generate_witness.js circuito_js/circuito.wasm input.json witness.wtns

if [ ! -f pot12_final.ptau ]; then
    echo "Generando Powers of Tau (POT)..."
    snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
    snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
fi

echo "Preparando Powers of Tau para fase 2..."
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Setup Groth16..."
snarkjs groth16 setup circuito.r1cs pot12_final.ptau circuito_0000.zkey
snarkjs zkey contribute circuito_0000.zkey circuito_final.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey circuito_final.zkey verification_key.json

echo "Generando prueba..."
snarkjs groth16 prove circuito_final.zkey witness.wtns proof.json public.json

echo "Verificando prueba..."
snarkjs groth16 verify verification_key.json public.json proof.json

mkdir -p web
cp verification_key.json web/
cp proof.json web/
cp public.json web/
