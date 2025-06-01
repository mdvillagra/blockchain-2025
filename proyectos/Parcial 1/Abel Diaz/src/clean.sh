#!/bin/bash

# Script de limpieza de archivos y carpetas

# Configuración
CARPETA_LIMPIAR="./outputs"      # Carpeta a limpiar
ARCHIVO_A_ELIMINAR="input.json"  # Archivo a eliminar

# Verificar y eliminar carpeta
if [ -d "$CARPETA_LIMPIAR" ]; then
    echo "Eliminando carpeta: $CARPETA_LIMPIAR"
    rm -rf "$CARPETA_LIMPIAR"
    echo "✅ Carpeta eliminada correctamente."
else
    echo "La carpeta $CARPETA_LIMPIAR no existe."
fi

# Verificar y eliminar archivo
if [ -f "$ARCHIVO_A_ELIMINAR" ]; then
    echo "Eliminando archivo: $ARCHIVO_A_ELIMINAR"
    rm -f "$ARCHIVO_A_ELIMINAR"
    echo "✅ Archivo eliminado correctamente."
else
    echo "El archivo $ARCHIVO_A_ELIMINAR no existe."
fi

echo "Operación completada."