# Variables
CIRCUIT_NAME=circuit
CIRCUIT_DIR=circuits
ARTIFACTS_DIR=artifacts
INPUT_FILE=test/input.json

# Instalar las dependencias, compilar y generar las claves y la prueba
setup:
	@echo "Instalando dependencias"
	npm install
	@echo "Compilando el circuito..."
	circom $(CIRCUIT_DIR)/$(CIRCUIT_NAME).circom --r1cs --wasm --sym -o $(ARTIFACTS_DIR)
	@echo "Generando claves y prueba..."
	cd artifacts/circuit_js && \
		node generate_witness.js circuit.wasm ../../test/input.json witness.wtns && \
		snarkjs groth16 setup ../../artifacts/circuit.r1cs ../../powersOfTau28_hez_final_10.ptau circuit_0000.zkey && \
		snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="Contribución 1" -v && \
		snarkjs zkey export verificationkey circuit_0001.zkey verification_key.json && \
		snarkjs groth16 prove circuit_0001.zkey witness.wtns proof.json public.json

# Verificar la prueba
verify:
	@echo "Verificando la prueba..."
	cd $(ARTIFACTS_DIR)/$(CIRCUIT_NAME)_js && \
		snarkjs groth16 verify verification_key.json public.json proof.json

# Configurar y ejecutar el servidor para pruebas en el navegador
browser:
	@echo "Iniciando el servidor..."
	cp artifacts/circuit_js/proof.json public/
	cp artifacts/circuit_js/public.json public/
	node server.js

# Limpiar archivos generados
clean:
	@echo "Limpiando archivos..."
	rm -rf $(ARTIFACTS_DIR)/*
