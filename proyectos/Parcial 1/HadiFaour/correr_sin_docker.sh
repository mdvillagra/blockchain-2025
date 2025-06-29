#!/bin/bash

# Script para ejecutar sin Docker (versión directa en host)
# Asume que:
# 1. Todas las dependencias están instaladas
# 2. El repositorio está clonado
# 3. El usuario está al mismo nivel de directorio que el script Dockerizado

echo "Iniciando ejecución directa (sin Docker)..."
echo ""

# Navegar al directorio ScriptsZK
echo "Entrando al directorio ScriptsZK..."
cd ScriptsZK || { echo "Error: No se pudo cambiar a ScriptsZK"; exit 1; }

# Dar permisos de ejecución
echo "Dando permisos de ejecución a los scripts..."
chmod +x compilar_circuito.sh generar_verificar_prueba.sh || { echo "Error al dar permisos"; exit 1; }

# Compilar circuito
echo "Ejecutando compilar_circuito.sh..."
./compilar_circuito.sh || { echo "Error al compilar circuito"; exit 1; }

# Ejecutar prueba con inputs automatizados
echo "Ejecutando generar_verificar_prueba.sh (con inputs automatizados)..."
(echo 'input1'; sleep 40; echo 'input2') | ./generar_verificar_prueba.sh || { 
    echo "Error al generar/verificar prueba"; 
    exit 1; 
}

echo ""
echo "Todos los comandos se ejecutaron correctamente!"
echo "Proceso completado."