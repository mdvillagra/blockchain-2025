
#!/bin/bash


PROJECT_NAME="circuit_verifier"
CIRCUIT_NAME="circuit"


echo "Instalando dependencias..."
sudo npm install


echo "Compilando el circuito..."
circom ${CIRCUIT_NAME}.circom --r1cs --wasm --sym -l node_modules


echo "Entrando a la carpeta circuit_js..."
cd ./${CIRCUIT_NAME}_js



TEST_FILES=(
    "test_data.json"
    "test_data_2.json"
    "test_data_3.json"
)



for test_file in "${TEST_FILES[@]}"; do

    # 3. copiamos el archivo test_data.json al input.json
    echo "Copiando test_data.json a input.json..."
    cp ../${test_file} input.json

    # 4. Ejecutar los comandos de la fase de pruebas
    echo "Generando testigo..."
    node generate_witness.js ${CIRCUIT_NAME}.wasm input.json witness.wtns

    echo "Iniciando ceremonia de trusted setup..."
    # Fase 1: Powers of Tau
    snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
    snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
    snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

    # Fase 2: Setup Groth16
    snarkjs groth16 setup ../${CIRCUIT_NAME}.r1cs pot12_final.ptau ${CIRCUIT_NAME}_0000.zkey
    snarkjs zkey contribute ${CIRCUIT_NAME}_0000.zkey ${CIRCUIT_NAME}_0001.zkey --name="1st Contributor Name" -v

    echo "Exportando clave de verificación..."
    snarkjs zkey export verificationkey ${CIRCUIT_NAME}_0001.zkey verification_key.json

    echo "Generando y verificando prueba..."
    snarkjs groth16 prove ${CIRCUIT_NAME}_0001.zkey witness.wtns proof.json public.json
    snarkjs groth16 verify verification_key.json public.json proof.json

    echo "Proceso completado!"
done