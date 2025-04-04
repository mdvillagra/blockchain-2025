#!/bin/bash

echo "Step 1: Creating initial powersoftau file..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

echo "Step 2: Making first contribution (automated)..."
echo "random text" | snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="some random entropy"

echo "Step 3: Preparing phase 2..."
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Step 4: Setting up Groth16..."
snarkjs groth16 setup ../circuito.r1cs pot12_final.ptau circuito_0000.zkey

echo "Step 5: Making second contribution (automated)..."
echo "more random text" | snarkjs zkey contribute circuito_0000.zkey circuito_0001.zkey --name="Second contribution" -v -e="another random entropy"

echo "Step 6: Exporting verification key..."
snarkjs zkey export verificationkey circuito_0001.zkey verification_key.json

echo "Configuracion de pruebas completada!"