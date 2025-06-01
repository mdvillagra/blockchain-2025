#!/bin/bash

# Nombre del circuito
CIRCUIT_NAME="circuit"

# Eliminar archivos generados
echo "Borrando archivos generados..."

# Archivos generados en la compilación
rm -f "$CIRCUIT_NAME.r1cs" "$CIRCUIT_NAME".wasm "$CIRCUIT_NAME".sym

# Eliminar el directorio _js generado al compilar
rm -rf "$CIRCUIT_NAME"_js

# Archivos generados por powersoftau
rm -f pot12_0000.ptau pot12_0001.ptau pot12_final.ptau

# Archivos generados durante la configuración de la prueba ZKP
rm -f "$CIRCUIT_NAME"_0000.zkey "$CIRCUIT_NAME"_0001.zkey verification_key.json

# Archivos generados durante la generación de la prueba
rm -f proof.json public.json witness.wtns public_filtered.json input.json

# Mensaje de confirmación
echo "Archivos generados eliminados exitosamente."
