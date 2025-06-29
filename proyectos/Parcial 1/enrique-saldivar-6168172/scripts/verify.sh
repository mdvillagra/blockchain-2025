#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/build"
INPUT_DIR="$BUILD_DIR/input"
CIRCUIT_DIR="$BUILD_DIR/circuit_js"

echo "Verificando pruebas"
for i in {0..4}; do
  echo "Verificando prueba $i"
  snarkjs groth16 verify "$BUILD_DIR/verification_key.json" "$BUILD_DIR/public$i.json" "$BUILD_DIR/proof$i.json"
done

echo "Pruebas verificadas"
echo "Generando contrato de verificacion"
snarkjs zkey export solidityverifier "$BUILD_DIR/circuit_0001.zkey" "$BUILD_DIR/verifier.sol"
echo "Contrato de verificacion generado"
