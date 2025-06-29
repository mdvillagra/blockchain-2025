#!/bin/bash
# scripts.sh - Compila, genera el test, realiza la configuración confiable, genera la prueba y la verifica

set -e

echo "Creando carpeta de salida build"
mkdir -p build

echo "Compilando el circuito"
circom primerParcial.circom --r1cs --wasm --sym -o build

echo "Generando el test (witness)"
node build/primerParcial_js/generate_witness.js build/primerParcial_js/primerParcial.wasm input.json witness.wtns

echo "Ejecutando Powers of Tau - Fase 1"
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="estudiante" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Realizando configuración específica del circuito - Fase 2"
snarkjs groth16 setup build/primerParcial.r1cs pot12_final.ptau primerParcial.zkey
snarkjs zkey export verificationkey primerParcial.zkey verification_key.json

echo "Generando la prueba"
snarkjs groth16 prove primerParcial.zkey witness.wtns proof.json public.json

echo "Verificando la prueba"
snarkjs groth16 verify verification_key.json public.json proof.json
node verificador.js

