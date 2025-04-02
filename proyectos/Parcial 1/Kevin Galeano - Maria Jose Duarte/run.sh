#!/bin/bash

# Detener la ejecución en caso de error
set -e

# Función para compilar el circuito
compile() {
    echo "🚀 Compilando el circuito main.circom..."
    circom main.circom --r1cs --sym --wasm
    echo "✅ Compilación completada."
}


# Función para generar el testigo
generate_witness() {
    echo "🔹 Creando archivo de entrada en main_js/input.json..."
    mkdir -p main_js  # Asegurar que la carpeta exista
    echo '{
      "a": "2",
      "b": "3"
    }' > main_js/input.json

    echo "🚀 Generando testigo..."
    node main_js/generate_witness.js main_js/main.wasm main_js/input.json main_js/witness.wtns
    snarkjs wtns export json main_js/witness.wtns -o main_js/witness.json
    echo "✅ Testigo generado."
}

# Función para generar el Trusted Setup si no existe
setup() {
    if [[ ! -f pot12_final_prepared.ptau ]]; then
        echo "🚀 Iniciando Trusted Setup de Groth16..."
        snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
        snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau --name="Contribución automática" -v
        snarkjs powersoftau prepare phase2 pot12_final.ptau pot12_final_prepared.ptau -v
        snarkjs groth16 setup main.r1cs pot12_final_prepared.ptau main_0000.zkey
        snarkjs zkey contribute main_0000.zkey main_final.zkey --name="Segunda contribución" -v
        snarkjs zkey export verificationkey main_final.zkey verification_key.json
        echo "✅ Trusted Setup completado."
    else
        echo "✅ Trusted Setup ya existe, saltando este paso."
    fi
}

# Función para generar la prueba
generate_proof() {
    echo "🚀 Generando prueba SNARK..."
    generate_witness  # Genera el testigo antes de la prueba
    setup  # Asegura que el setup está hecho
    snarkjs groth16 prove main_final.zkey main_js/witness.wtns prueba.json public.json
    echo "✅ Prueba generada con éxito."
}

# Función para verificar la prueba
verify_proof() {
    echo "🚀 Verificando la prueba SNARK..."
    snarkjs groth16 verify verification_key.json public.json prueba.json
    echo "✅ Verificación completada."
}

verify_node() {
    npm i
    clear
    npm run verify
}

# Mostrar opciones si no se pasa un argumento
if [ $# -eq 0 ]; then
    echo "❌ Error: No se especificó un comando."
    echo "📌 Uso: ./mi_script.sh [compile | snark | witness | proof | verify]"
    exit 1
fi

# Ejecutar la acción según el argumento recibido
case "$1" in
    compile)
        compile
        ;;
    proof)
        generate_proof
        ;;
    verify)
        verify_proof
        ;;
    verify-node)
        verify_node
        ;;
    *)
        echo "❌ Comando no reconocido: $1"
        echo "📌 Uso: ./mi_script.sh [compile | snark | witness | proof | verify]"
        exit 1
        ;;
esac
