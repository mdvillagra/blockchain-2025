#!/bin/bash

set -e

CIRCUIT_NAME=square_sum_mod
CIRCUIT_DIR=circuit
BUILD_DIR=build
POT_FILE=pot12_final.ptau

echo "🧼 Limpiando build antiguo..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

echo "🔧 Compilando circuito..."
circom $CIRCUIT_DIR/$CIRCUIT_NAME.circom --r1cs --wasm --sym -o $BUILD_DIR

echo "🧪 Configurando clave de prueba..."
snarkjs groth16 setup $BUILD_DIR/$CIRCUIT_NAME.r1cs $POT_FILE $BUILD_DIR/$CIRCUIT_NAME.zkey

echo "📄 Exportando clave de verificación..."
snarkjs zkey export verificationkey $BUILD_DIR/$CIRCUIT_NAME.zkey $BUILD_DIR/verification_key.json

echo "🧬 Generando testigo..."
node $BUILD_DIR/${CIRCUIT_NAME}_js/generate_witness.js $BUILD_DIR/${CIRCUIT_NAME}_js/$CIRCUIT_NAME.wasm $CIRCUIT_DIR/input.json $BUILD_DIR/witness.wtns

echo "🧾 Generando prueba..."
snarkjs groth16 prove $BUILD_DIR/$CIRCUIT_NAME.zkey $BUILD_DIR/witness.wtns $BUILD_DIR/proof.json $BUILD_DIR/public.json

echo "✅ Verificando prueba..."
snarkjs groth16 verify $BUILD_DIR/verification_key.json $BUILD_DIR/public.json $BUILD_DIR/proof.json

echo "📤 Resultado público:"
cat $BUILD_DIR/public.json

echo "🎉 ¡Todo correcto! La prueba fue verificada con éxito."

