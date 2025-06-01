#!/bin/bash

# Compila el circuito
echo "[1] Compilando el circuito..."
circom circuit.circom --r1cs --wasm --sym -o build

# Muestra info del circuito
echo "[2] Información del circuito:"
snarkjs r1cs info build/circuit.r1cs

