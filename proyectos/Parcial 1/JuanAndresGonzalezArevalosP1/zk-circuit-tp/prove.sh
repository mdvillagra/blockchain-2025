#!/bin/bash
set -e

echo "[1] Generando el testigo (witness)..."
node build/circuit_js/generate_witness.js build/circuit_js/circuit.wasm input.json witness.wtns

echo "[2] Iniciando powers of tau (ptau)..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Juan contribuyente" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau

echo "[3] Generando zkey..."
snarkjs groth16 setup build/circuit.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="Juan zkey" -v
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

echo "[4] Generando la prueba..."
snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json

echo "[5] Verificando la prueba..."
snarkjs groth16 verify verification_key.json public.json proof.json

