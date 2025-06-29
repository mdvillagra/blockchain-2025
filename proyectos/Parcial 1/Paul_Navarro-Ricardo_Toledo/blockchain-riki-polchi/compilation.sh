#!/bin/bash

echo "🛠️  Iniciando instalación de dependencias..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "📦 Node.js no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y nodejs npm
else
    echo "✅ Node.js ya está instalado: $(node -v)"
fi

# Verificar si circom está instalado
if ! command -v circom &> /dev/null
then
    echo "📦 Circom no está instalado. Instalando Circom 2.0..."
    
    # Instalar dependencias necesarias
    sudo apt update
    sudo apt install -y git build-essential rustc cargo

    # Clonar y compilar Circom desde el repositorio oficial
    git clone https://github.com/iden3/circom.git
    cd circom
    cargo build --release

    # Mover el binario al PATH
    sudo cp target/release/circom /usr/local/bin/
    cd ..
    rm -rf circom

    echo "✅ Circom 2.0 instalado correctamente: $(circom --version)"
else
    echo "✅ Circom ya está instalado: $(circom --version)"
fi


# Verificar si snarkjs está instalado
if ! command -v snarkjs &> /dev/null
then
    echo "📦 Instalando snarkjs..."
    sudo npm install -g snarkjs
else
    #echo "✅ SnarkJS ya está instalado: $(snarkjs --version)"
    echo "✅ SnarkJS ya está instalado"
fi

# Compilar el circuito
echo "⏳ Compilando el circuito..."
circom square_sum_mod.circom --r1cs --wasm --sym -o 

echo "✅ Circuito compilado exitosamente."

# Mover el archivo wasm desde la carpeta generada
if [ -f "square_sum_mod_js/square_sum_mod.wasm" ]; then
    mv square_sum_mod_js/square_sum_mod.wasm .
    echo "📦 Archivo 'square_sum_mod.wasm' movido al directorio actual."
else
    echo "⚠️  No se encontró 'square_sum_mod_js/square_sum_mod.wasm'."
fi

echo "🧮 Generando el testigo..."
snarkjs wtns calculate square_sum_mod.wasm input.json witness.wtns

echo "Exportando testigo a json..."
snarkjs wtns export json witness.wtns -o output.json

# Descargar pot12 si no existe
if [ ! -f pot12_final.ptau ]; then
    echo "⬇️  Descargando archivo ptau..."
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -O pot12_final.ptau
fi

# Setup del zkey
echo "🔐 Generando circuit_final.zkey..."
snarkjs groth16 setup square_sum_mod.r1cs pot12_final.ptau circuit_final.zkey

# Exportar clave de verificación
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# Generar la prueba
echo "🛡️  Generando la prueba..."
snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json

# Verificar la prueba
echo "🔍 Verificando la prueba..."
snarkjs groth16 verify verification_key.json public.json proof.json

echo "✅ Proceso completo."