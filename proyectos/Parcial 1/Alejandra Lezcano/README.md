# 🚀 Verificación ZK-SNARK - Documentación Completa

## 🔍 Descripción
Implementación de un circuito Circom para verificar `c = (a² + b²) mod p` con ZK-SNARKs, incluyendo:
1. Compilación del circuito
2. Generación de pruebas
3. Verificación en Node.js y navegador
4. Interfaz web mejorada

## 📋 Requisitos
| Componente | Versión |
|------------|---------|
| Node.js | ≥16.x |
| Circom | 2.0.x |
| snarkjs | 0.7.x |
| Navegador | Chrome/Firefox/Edge |

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
node circuit_js/generate_witness.js circuit.wasm input.json witness.wtns

# Generar prueba zk-SNARK
snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json
```

### 3️⃣ Verificación en Navegador (Nuevo Proceso)
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
