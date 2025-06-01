#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/build"
INPUT_DIR="$PROJECT_DIR/input"
CIRCUIT_DIR="$BUILD_DIR/circuit_js"

mkdir -p "$INPUT_DIR"

for i in {0..4}; do
  echo "Generando pruebas aleatorias $i"
  echo "{ \"a\": $(((RANDOM % 9) + 1)), \"b\": $(((RANDOM % 9) + 1)), \"p\": $(((RANDOM % 9) + 1)) }" >"$INPUT_DIR/input$i.json"
done

echo "Generando testigos"
for i in {0..4}; do
  echo "Procesando testigo $i"
  node "$CIRCUIT_DIR/generate_witness.js" "$CIRCUIT_DIR/circuit.wasm" "$INPUT_DIR/input$i.json" "$BUILD_DIR/witness$i.wtns"
  wait $!
done

echo "Generando pruebas"
for i in {0..4}; do
  echo "Generando prueba $i"
  snarkjs groth16 prove "$BUILD_DIR/circuit_0001.zkey" "$BUILD_DIR/witness$i.wtns" "$BUILD_DIR/proof$i.json" "$BUILD_DIR/public$i.json"
  wait $!
done
