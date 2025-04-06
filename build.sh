#!/bin/bash

set -e  # Salir si hay un error

echo "Compilando el circuito..."
circom circuit.circom --r1cs --wasm --sym -o circuit

echo "Creando input.json en circuit/circuit_js/"
cat > circuit/circuit_js/input.json <<EOL
{
  "a": 5,
  "b": 10
}
EOL

echo "Generando el testigo..."
cd circuit/circuit_js/
node generate_witness.js circuit.wasm input.json witness.wtns
cd ..

echo "Ejecutando Powers of Tau (fase 1)..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Setup de Groth16..."
snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey circuit_0001.zkey verification_key.json

echo "Generando prueba..."
snarkjs groth16 prove circuit_0001.zkey circuit_js/witness.wtns proof.json public.json

echo "Verificando prueba..."
snarkjs groth16 verify verification_key.json public.json proof.json

cat public.json
