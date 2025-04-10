#!/bin/bash

# Variables
CIRCUIT_DIR="../Circuito"
SCRIPT_DIR=$(pwd)
OUTPUT_DIR="${CIRCUIT_DIR}/out"
CIRCUIT_NAME="circuito_principal"
JS_DIR="${OUTPUT_DIR}/${CIRCUIT_NAME}_js"
INPUT_FILE="${CIRCUIT_DIR}/input.json"
VERIFIER_DIR="../Pruebas"

# Verificar que los archivos necesarios existen
if [ ! -f "$JS_DIR/${CIRCUIT_NAME}.wasm" ]; then
    echo "Error: No se encontró el archivo .wasm. ¿Compilaste el circuito primero?"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: No se encontró input.json en ${CIRCUIT_DIR}"
    exit 1
fi

# Crear directorio de pruebas si no existe
mkdir -p $VERIFIER_DIR

# Fase 1: Configuración de la ceremonia de confianza (Trusted Setup)
echo "Iniciando ceremonia de confianza..."
npx snarkjs powersoftau new bn128 12 "${VERIFIER_DIR}/pot12_0000.ptau" -v
npx snarkjs powersoftau contribute "${VERIFIER_DIR}/pot12_0000.ptau" "${VERIFIER_DIR}/pot12_0001.ptau" --name="Primera contribución" -v

# Fase 2: Preparación para circuito específico
echo "Preparando para circuito específico..."
npx snarkjs powersoftau prepare phase2 "${VERIFIER_DIR}/pot12_0001.ptau" "${VERIFIER_DIR}/pot12_final.ptau" -v
npx snarkjs groth16 setup "${OUTPUT_DIR}/${CIRCUIT_NAME}.r1cs" "${VERIFIER_DIR}/pot12_final.ptau" "${VERIFIER_DIR}/${CIRCUIT_NAME}_0000.zkey"
npx snarkjs zkey contribute "${VERIFIER_DIR}/${CIRCUIT_NAME}_0000.zkey" "${VERIFIER_DIR}/${CIRCUIT_NAME}_0001.zkey" --name="1ra contribución del circuito" -v

# Exportar clave de verificación
npx snarkjs zkey export verificationkey "${VERIFIER_DIR}/${CIRCUIT_NAME}_0001.zkey" "${VERIFIER_DIR}/verification_key.json"

# Generar testigo (witness)
echo "Generando testigo..."
node "${JS_DIR}/generate_witness.js" "${JS_DIR}/${CIRCUIT_NAME}.wasm" "$INPUT_FILE" "${VERIFIER_DIR}/witness.wtns"

# Generar prueba
echo "Generando prueba zk-SNARK..."
npx snarkjs groth16 prove "${VERIFIER_DIR}/${CIRCUIT_NAME}_0001.zkey" "${VERIFIER_DIR}/witness.wtns" "${VERIFIER_DIR}/proof.json" "${VERIFIER_DIR}/public.json"

# Verificar prueba
echo "Verificando prueba..."
npx snarkjs groth16 verify "${VERIFIER_DIR}/verification_key.json" "${VERIFIER_DIR}/public.json" "${VERIFIER_DIR}/proof.json"

# Generar verificador Solidity
echo "Generando verificador Solidity..."
npx snarkjs zkey export solidityverifier "${VERIFIER_DIR}/${CIRCUIT_NAME}_0001.zkey" "${VERIFIER_DIR}/verifier.sol"

# Generar verificador JavaScript portable
echo "Generando verificador portable para Node.js/navegador..."
npx snarkjs generatecall "${VERIFIER_DIR}/public.json" > "${VERIFIER_DIR}/verifier.js"

# Crear archivo HTML de ejemplo para verificación en navegador
cat <<EOF > "${VERIFIER_DIR}/verifier.html"
<!DOCTYPE html>
<html>
<head>
    <title>Verificador ZK</title>
    <script src="https://cdn.jsdelivr.net/npm/snarkjs@latest/dist/snarkjs.min.js"></script>
</head>
<body>
    <h1>Verificador de Prueba ZK</h1>
    <button onclick="verifyProof()">Verificar Prueba</button>
    <div id="verificationResult"></div>

    <script src="verifier.js"></script>
    <script>
        async function verifyProof() {
            const verificationKey = await fetch("verification_key.json").then(res => res.json());
            const publicSignals = await fetch("public.json").then(res => res.json());
            const proof = await fetch("proof.json").then(res => res.json());
            
            const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
            
            document.getElementById("verificationResult").innerHTML = isValid ? 
                "<p style='color:green;'>✓ Prueba válida</p>" : 
                "<p style='color:red;'>✗ Prueba inválida</p>";
        }
    </script>
</body>
</html>
EOF

echo "Proceso completado. Archivos generados en: ${VERIFIER_DIR}"
echo "Puedes probar el verificador en el navegador abriendo: ${VERIFIER_DIR}/verifier.html"