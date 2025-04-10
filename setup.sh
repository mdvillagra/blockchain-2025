#!/bin/bash

# Instalar dependencias si es necesario
# npm install -g circom snarkjs

# Compilar el circuito
circom sumacuadrados.circom --r1cs --wasm --sym

# Generar la clave de prueba
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs groth16 setup sumacuadrados.r1cs pot12_final.ptau sumacuadrados_0000.zkey
snarkjs zkey contribute sumacuadrados_0000.zkey sumacuadrados_0001.zkey --name="Second contribution" -v
snarkjs zkey export verificationkey sumacuadrados_0001.zkey verification_key.json

# Limpiar archivos temporales
rm pot12_0000.ptau pot12_0001.ptau sumacuadrados_0000.zkey