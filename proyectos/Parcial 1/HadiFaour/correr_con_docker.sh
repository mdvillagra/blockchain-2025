#!/bin/bash

# Construir los contenedores
echo "Construyendo los contenedores con docker compose build..."
docker compose build || { echo "Error al construir los contenedores"; exit 1; }

# Iniciar los contenedores
echo "Iniciando los contenedores con docker compose up..."
docker compose up -d || { echo "Error al iniciar los contenedores"; exit 1; }

# Esperar un momento para que el contenedor principal esté listo
echo "Esperando que el contenedor esté listo..."
sleep 5

# Ejecutar los comandos dentro del contenedor principal
echo "Ejecutando comandos dentro del contenedor..."
docker exec -it contenedor-principal bash -c "
  echo 'Entrando al directorio ScriptsZK...';
  cd ScriptsZK || { echo 'Error: no se pudo cambiar a ScriptsZK'; exit 1; };
  
  echo 'Dando permisos de ejecución a los scripts...';
  chmod +x compilar_circuito.sh generar_verificar_prueba.sh || { echo 'Error al dar permisos'; exit 1; };
  
  echo 'Ejecutando compilar_circuito.sh...';
  ./compilar_circuito.sh || { echo 'Error al compilar circuito'; exit 1; };
  
  echo 'Ejecutando generar_verificar_prueba.sh...';
  (echo 'input1'; sleep 40; echo 'input2') | ./generar_verificar_prueba.sh || { echo 'Error al generar/verificar prueba'; exit 1; };
  
  echo 'Todos los comandos se ejecutaron correctamente!';
"

echo "Proceso completado."