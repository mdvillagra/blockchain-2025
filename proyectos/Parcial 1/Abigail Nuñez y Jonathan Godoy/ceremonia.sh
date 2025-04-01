echo "Comenzando una nueva ceremonia de "Powers of Tau"..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
if [ $? -ne 0 ]; then
  echo "Error al comenzar la ceremonia"
  exit 1
fi

echo "Contribuyendo a la ceremonia..."
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
if [ $? -ne 0 ]; then
  echo "Error al contribuir a la ceremonia"
  exit 1
fi

echo "Preparando la fase 2 de la ceremonia..."
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
if [ $? -ne 0 ]; then
  echo "Error en la preparacion"
  exit 1
fi

echo "Generando .zkey (contiene las keys de prueba y verificación, junto con todas las contribuciones de la fase 2)..."
snarkjs groth16 setup parcial1.r1cs pot12_final.ptau parcial1_0000.zkey
if [ $? -ne 0 ]; then
  echo "Error en la generacion del .zkey"
  exit 1
fi

echo "Contribuyendo a la fase 2 de la ceremonia..."
snarkjs zkey contribute parcial1_0000.zkey parcial1_0001.zkey --name="1st Contributor Name" -v
if [ $? -ne 0 ]; then
  echo "Error al contribuir a la ceremonia"
  exit 1
fi

echo "Exportando la clave de verificacion..."
snarkjs zkey export verificationkey parcial1_0001.zkey verification_key.json
if [ $? -ne 0 ]; then
  echo "Error al exportar la clave de verificacion"
  exit 1
fi

echo "Trusted setup ejecutado correctamente"