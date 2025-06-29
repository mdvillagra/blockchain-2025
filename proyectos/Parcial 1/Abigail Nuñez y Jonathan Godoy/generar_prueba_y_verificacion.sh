
echo "Generando prueba..."
snarkjs groth16 prove parcial1_0001.zkey parcial1_js/witness.wtns proof.json public.json
if [ $? -ne 0 ]; then
  echo "Error al generar la prueba"
  exit 1
fi

echo "Prueba generada correctamente"

echo "Verificando prueba..."
snarkjs groth16 verify verification_key.json public.json proof.json
if [ $? -ne 0 ]; then
  echo "Error al verificar la prueba"
  exit 1
fi

echo "Prueba verificada"