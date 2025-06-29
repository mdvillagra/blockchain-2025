#!/bin/bash

echo "🧹 Eliminando archivos generados..."

# Lista de archivos a eliminar si existen
files=(
    square_sum_mod.r1cs
    square_sum_mod.sym
    square_sum_mod.wasm
    witness.wtns
    output.json
)

# Recorrer y eliminar si existe
for file in "${files[@]}"
do
    if [ -f "$file" ]; then
        rm "$file"
        echo "🗑️  Archivo '$file' eliminado."
    else
        echo "⚠️  Archivo '$file' no encontrado."
    fi
done

# Carpeta JS
if [ -d "square_sum_mod_js" ]; then
    rm -rf square_sum_mod_js
    echo "📂 Carpeta 'square_sum_mod_js' eliminada."
else
    echo "⚠️  Carpeta 'square_sum_mod_js' no encontrada."
fi

echo "✅ Limpieza completada."
