#!/bin/bash

CIRCUIT_NAME="circuit"

# Paso 1: Compilar el circuito
echo "Compilando el circuito..."
circom "$CIRCUIT_NAME.circom" --r1cs --wasm --sym

# Verificar si la compilación fue exitosa
if [ ! -f "$CIRCUIT_NAME.r1cs" ]; then
    echo "Error: La compilación falló."
    exit 1
fi

# Paso 2: Pedir valores de entrada al usuario
echo "Introduce el valor de a (entrada privada):"
read A
echo "Introduce el valor de b (entrada privada):"
read B


# Crear input.json (solo inputs privados y públicos)
cat > input.json <<EOF
{
    "a": $A,
    "b": $B
}
EOF

# Paso 3: Generar testimonio (witness)
echo "Generando testimonio..."
node "$CIRCUIT_NAME"_js/generate_witness.js "$CIRCUIT_NAME"_js/"$CIRCUIT_NAME".wasm input.json witness.wtns

# Paso 4: Configuración de la prueba de conocimiento cero (ZKP)
echo "Configurando la prueba de conocimiento cero..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Generar clave de verificación
snarkjs groth16 setup "$CIRCUIT_NAME.r1cs" pot12_final.ptau "$CIRCUIT_NAME"_0000.zkey

# Paso 5: Contribución adicional a la clave de prueba
snarkjs zkey contribute "$CIRCUIT_NAME"_0000.zkey "$CIRCUIT_NAME"_0001.zkey --name="1st Contributor" -v

# Paso 6: Exportar la clave de verificación pública
snarkjs zkey export verificationkey "$CIRCUIT_NAME"_0001.zkey verification_key.json

# Paso 7: Generar la prueba
echo "Generando la prueba..."
snarkjs groth16 prove "$CIRCUIT_NAME"_0001.zkey witness.wtns proof.json public.json

# Paso 8: Verificar la prueba
echo "Verificando la prueba..."
snarkjs groth16 verify verification_key.json public.json proof.json
