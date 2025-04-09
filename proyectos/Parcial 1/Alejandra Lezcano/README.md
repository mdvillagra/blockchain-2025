# 🚀 Verificación ZK-SNARK - Documentación Completa

## 🔍 Descripción

Implementación de un circuito Circom para verificar `c = (a² + b²) mod p` con ZK-SNARKs, incluyendo:

1. Compilación del circuito
2. Generación de pruebas
3. Verificación en Node.js y navegador
4. Interfaz web mejorada

## 📋 Requisitos

| Componente | Versión            |
| ---------- | ------------------- |
| Node.js    | ≥16.x              |
| Circom     | 2.0.x               |
| snarkjs    | 0.7.x               |
| Navegador  | Chrome/Firefox/Edge |

# 🚀 Instalación y Uso - Versión Mejorada

## 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/mdvillagra/blockchain-2025.git
cd blockchain-2025

npm install -g snarkjs
```

## 2️⃣ Instalar Circom

```bash
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
export PATH=$PWD/target/release:$PATH
cd ..
```

## ⚙️ Uso del Sistema

### 1️⃣ Compilar el Circuito

```bash
circom circuit.circom --r1cs --wasm --sym
```

### 2️⃣ Generar Pruebas

```bash
# Generar testigo
node circuit_js/generate_witness.js circuit_js/circuit.wasm input.json witness.wtns 

Crear el archivo inicial:

    snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

Contribuir al proceso:

    snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau --name="contribución" -v

Preparar

    snarkjs powersoftau prepare phase2 pot12_final.ptau pot12_prep.ptau -v

Configurar el Sistema de Pruebas (Groth16)

Ejecutar estos comandos:

    snarkjs groth16 setup circuit.r1cs pot12_prep.ptau circuit_0000.zkey

    snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="final" -v

    snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

Generación y Verificación de la Prueba

Para crear la prueba y generar las señales públicas:

    snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json

Para verificar:

    snarkjs groth16 verify verification_key.json public.json proof.json
Para verificar con node:

	node verificar.js

```

### 3️⃣ Verificación en Navegador 

```bash
cd web_verifier
npx http-server
```

#### Pasos en el navegador ([http://localhost:8080](http://localhost:8080)):

1. Cargar archivos requeridos:
   - `verification_key.json`
   - `proof.json`
   - `public.json`
2. Hacer clic en **"Verificar Prueba"**
3. Resultados esperados:
   ```bash
   ✅ Prueba válida (verificación exitosa)
   ❌ Prueba inválida (error en la verificación)
   ```

## 📌 Nota Importante

La verificación requiere:

- Carga manual de los 3 archivos JSON
- Confirmación explícita del usuario
- Validación previa de los formatos

Esto proporciona mayor seguridad y control sobre el proceso de verificación.
