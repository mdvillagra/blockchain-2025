# Instalar dependencias solo si no existen
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi

echo "Iniciando ejecución..."

#1 Dar permisos a los scripts
chmod +x scripts/*.sh

#2 Compilar
./scripts/compile.sh

#3 Trusted setup (descarga ptau si no existe)
./scripts/setup.sh

#4 Generar prueba
./scripts/generate_proof.sh

#5 Verificar
./scripts/verify.sh


