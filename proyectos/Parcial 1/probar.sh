#!/bin/bash
sed -i "s/\"a\": [0-9]*/\"a\": $1/" entradas.json
sed -i "s/\"b\": [0-9]*/\"b\": $2/" entradas.json
echo "entradas.json:"
cat entradas.json
echo
node circuito_js/generate_witness.js circuito_js/circuito.wasm entradas.json testigo.wtns
snarkjs groth16 setup circuito.r1cs pot12_final.ptau circuito_0000.zkey
echo "asdasd" | snarkjs zkey contribute circuito_0000.zkey circuito_0001.zkey --name="Brandon"
snarkjs zkey export verificationkey circuito_0001.zkey clave.json
snarkjs groth16 prove circuito_0001.zkey testigo.wtns prueba.json salida.json
snarkjs groth16 verify clave.json salida.json prueba.json
echo "salida.json:"
cat salida.json
echo
