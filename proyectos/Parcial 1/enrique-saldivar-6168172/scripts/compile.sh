#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$PROJECT_DIR/build"

# Compi;ar
circom "$PROJECT_DIR/circuits/circuit.circom" --r1cs --wasm --output "$PROJECT_DIR/build"

# Se comenta por que el archivo es muy grande > 9GB
# wget https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_23.ptau -O "$PROJECT_DIR/build/pot12_final.ptau"
# Se genera una nueva ceremonia
snarkjs powersoftau new bn128 12 "$PROJECT_DIR/build/pot12_0000.ptau"
snarkjs powersoftau contribute "$PROJECT_DIR/build/pot12_0000.ptau" "$PROJECT_DIR/build/pot12_0001.ptau" --name="Contribucion 1" -v -e="Cristiano mejor que messi"
snarkjs powersoftau prepare phase2 "$PROJECT_DIR/build/pot12_0001.ptau" "$PROJECT_DIR/build/pot12_final.ptau"

BUILD_DIR="$PROJECT_DIR/build"
# Wait for the circom compilation to finish
snarkjs groth16 setup "$BUILD_DIR/circuit.r1cs" "$BUILD_DIR/pot12_final.ptau" "$BUILD_DIR/circuit_0000.zkey"
snarkjs zkey contribute "$BUILD_DIR/circuit_0000.zkey" "$BUILD_DIR/circuit_0001.zkey" --name="Contribucion X" -v -e="Siuuuu"
snarkjs zkey export verificationkey "$BUILD_DIR/circuit_0001.zkey" "$BUILD_DIR/verification_key.json"
