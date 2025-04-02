#!/bin/bash

# Configuración
CIRCUIT_NAME="circuit"
INPUT_FILE="input.json"
OUTPUT_DIR="outputs"
HTML_VERIFIER="browser-verifier.html"
PTAU_FILE="${OUTPUT_DIR}/pot12_final.ptau"

# Crear directorio de salida
mkdir -p ${OUTPUT_DIR}

# 1. Compilar el circuito
echo "🔵 1. Compilando ${CIRCUIT_NAME}.circom..."
circom ${CIRCUIT_NAME}.circom --wasm --r1cs --sym -o ${OUTPUT_DIR} || exit 1

# 2. Generar input.json 
echo '{"a": "3", "b": "4", "p":"5"}' > ${INPUT_FILE}

# 3. Generar witness con Node.js
echo "🔵 2. Generando witness..."
node ${OUTPUT_DIR}/${CIRCUIT_NAME}_js/generate_witness.js \
    ${OUTPUT_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm \
    ${INPUT_FILE} \
    ${OUTPUT_DIR}/witness.wtns || exit 1

# 4. Trusted Setup (generar .ptau si no existe)
echo "🔵 3. Configurando entorno (trusted setup)..."
if [ ! -f "${PTAU_FILE}" ]; then
    echo "Generando archivo .ptau inicial (esto puede tardar unos minutos)..."
    snarkjs powersoftau new bn128 12 "${OUTPUT_DIR}/pot12_0000.ptau" -v || exit 1
    
    # Contribuir al archivo .ptau con entropía automática
    ENTROPY=$(head -c 1024 /dev/urandom | base64)
    echo "$ENTROPY" | snarkjs powersoftau contribute "${OUTPUT_DIR}/pot12_0000.ptau" "${OUTPUT_DIR}/pot12_0001.ptau" --name='First contribution' -v || exit 1
    
    snarkjs powersoftau prepare phase2 "${OUTPUT_DIR}/pot12_0001.ptau" "${PTAU_FILE}" -v || exit 1
fi

# 5. Generar claves (usando .ptau)
# Primero generamos el zkey inicial
snarkjs groth16 setup ${OUTPUT_DIR}/${CIRCUIT_NAME}.r1cs \
    ${PTAU_FILE} \
    ${OUTPUT_DIR}/circuit_0000.zkey || exit 1

# Luego contribuimos para obtener el zkey final
ENTROPY=$(head -c 1024 /dev/urandom | base64)
echo "$ENTROPY" | snarkjs zkey contribute ${OUTPUT_DIR}/circuit_0000.zkey ${OUTPUT_DIR}/circuit_final.zkey --name='First contribution' -v || exit 1

# 6. Exportar verification key
snarkjs zkey export verificationkey ${OUTPUT_DIR}/circuit_final.zkey \
    ${OUTPUT_DIR}/verification_key.json || exit 1

# 7. Generar prueba
echo "🔵 5. Generando prueba..."
snarkjs groth16 prove ${OUTPUT_DIR}/circuit_final.zkey \
    ${OUTPUT_DIR}/witness.wtns \
    ${OUTPUT_DIR}/proof.json \
    ${OUTPUT_DIR}/public.json || exit 1

# 8. Verificación LOCAL con Node.js
echo "🔵 6. Verificando prueba LOCAL (Node.js)..."
node verify.js || exit 1

# 9. Generar HTML para verificación en NAVEGADOR
echo "🔵 6. Generando verificador para navegador..."
cat > ${OUTPUT_DIR}/${HTML_VERIFIER} <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Verificador SnarkJS en Navegador</title>
    <script src="https://cdn.jsdelivr.net/npm/snarkjs@latest/build/snarkjs.min.js"></script>
</head>
<body>
    <h1>Verificador de Pruebas ZK</h1>
    <button onclick="verifyProof()">Verificar Prueba</button>
    <div id="result"></div>
    <script>
        async function verifyProof() {
            const verificationKey = await fetch("./verification_key.json").then(res => res.json());
            const proof = await fetch("./proof.json").then(res => res.json());
            const publicSignals = await fetch("./public.json").then(res => res.json());
            
            const isValid = await snarkjs.groth16.verify(
                verificationKey,
                publicSignals,
                proof
            );
            
            document.getElementById("result").innerHTML = 
                isValid ? "✅ Prueba VÁLIDA" : "❌ Prueba INVÁLIDA";
        }
    </script>
</body>
</html>
EOF

echo "🔵 7. Iniciando servidor..."
npx http-server ./outputs -p 8000 &  # Ejecutar en segundo plano y capturar su PID
SERVER_PID=$!  # Guardar el PID del servidor

echo "✨ ¡Todo listo! ✨"
echo "1. Verificación local: Hecha ✅"
echo "2. Para verificar en el navegador:"
echo "   - http://localhost:8000/browser-verifier.html"
echo "   - Haz clic en el botón 'Verificar Prueba'"

# Esperar que el servidor termine (permite Ctrl+C para cerrarlo)
wait $SERVER_PID