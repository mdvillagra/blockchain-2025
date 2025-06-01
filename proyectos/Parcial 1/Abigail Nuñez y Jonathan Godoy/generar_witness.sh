cd parcial1_js || { echo "Error: No se pudo cambiar al directorio parcial1_js"; exit 1; }


echo "Generando witness para el input..."
node generate_witness.js parcial1.wasm ../input.json witness.wtns
if [ $? -ne 0 ]; then
  echo "Error al generar witness para el input"
  exit 1
fi

echo "Witness generado"