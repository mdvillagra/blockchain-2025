#!/bin/bash

# Generar witness
node sumacuadrados_js/generate_witness.js sumacuadrados_js/sumacuadrados.wasm input.json witness.wtns

# Generar prueba
snarkjs groth16 prove sumacuadrados_0001.zkey witness.wtns proof.json public.json

# Exportar verificador
snarkjs zkey export solidityverifier sumacuadrados_0001.zkey verifier.sol