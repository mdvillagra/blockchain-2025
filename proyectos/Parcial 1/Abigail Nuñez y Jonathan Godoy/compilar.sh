echo "Compilando el circuito Circom..."
circom parcial1.circom --r1cs --wasm --sym --c
if [ $? -ne 0 ]; then
  echo "Error en la compilación del circuito"
  exit 1
fi

echo "Circuito circom compilado correctamente"