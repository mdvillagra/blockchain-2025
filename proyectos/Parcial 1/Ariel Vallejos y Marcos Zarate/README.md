# Proyecto Zero Knowledge Proof - Circuito Circom
**Ariel Vallejos y Marcos Zarate**

## ✅ Requisitos Previos

- Node.js (v16 o superior)
- snarkjs (Instalar globalmente o localmente)

```bash
npm install -g snarkjs
```

- Circom (v2.1.6 o superior)

Compilado desde el repo oficial:

```bash
git clone https://github.com/iden3/circom.git
cd circom
git checkout v2.1.6
cargo build --release
cp target/release/circom /usr/local/bin/
```

# Este proyecto utiliza componentes auxiliares de circomlib, como LessThan. Para que funcione correctamente

```bash
cd circuits
git clone https://github.com/iden3/circomlib.git
```
# Esto crea una carpeta circomlib dentro de circuits/, la cual es usada al compilar el circuito.

---

## ⚙️ 1. Instrucciones para Compilar y Ejecutar

### 1️⃣ Compilar el circuito

```bash
cd circuits
circom prueba.circom --r1cs --wasm --sym -o ../build -l .
```

### 2️⃣ Realizar la Ceremonia de Configuración (Trusted Setup)

```bash
cd ../zkbuild
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Contribución 1" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

### 3️⃣ Generar el zkey

```bash
snarkjs groth16 setup ../build/prueba.r1cs pot12_final.ptau prueba_0000.zkey
snarkjs zkey contribute prueba_0000.zkey prueba_final.zkey --name="Ariel y Marcos" -v
snarkjs zkey export verificationkey prueba_final.zkey verification_key.json
```

---

## 🧪 2. Generar una Prueba con Datos de Entrada

### 1️⃣ Crear el archivo `input.json`

```json
{
  "a": 3,
  "b": 4,
  "p": 5
}
```

### Como parte de la evaluacion de manejos de prueba diversos, podemos modificar los valores a gusto.
### Esto permite evaluar distintos escenarios y validar que el circuito funcione correctamente para múltiples entradas.

### 2️⃣ Generar el witness

```bash
node ../build/prueba_js/generate_witness.js ../build/prueba_js/prueba.wasm input.json witness.wtns
```

### 3️⃣ Generar la prueba

```bash
snarkjs groth16 prove prueba_final.zkey witness.wtns proof.json public.json
```
### Esto genera la prueba (proof.json) y los valores públicos esperados (public.json), en este formato 
### [
###   "0",
###   "5"
### ], como el resultado c y el primo p.
### Como parte de la evaluacion de manejos de prueba diversos, podemos modificar el valor de c, esto nos
### dara una prueba invalida luego al verificar la prueba siguiendo las instrucciones de abajo 

---

## ✅ 3. Verificar la Prueba

### 🔹 En Node.js

- Script de verificación: `verificar.js`

```bash
node verificar.js
```

### 🔹 En el Navegador

Archivos necesarios:

- `index.html`
- `script.js`
- `proof.json`, `public.json`, `verification_key.json`

#### Método 1: Usando `npx`

```bash
npx serve .
```

Abrir en el navegador:

```
http://localhost:3000/
```

#### Método 2: Usando Python

Si es Python 3.x:

```bash
python3 -m http.server 8000
```

Si usás Python 2.x:

```bash
python -m SimpleHTTPServer 8000
```

Abrir en el navegador:

```
http://localhost:8000/
```

---

## 🗂️ Estructura del Proyecto

```
1P BLOCKCHAIN/
├── circuits/
│   ├── prueba.circom
│   └── (otros archivos circom...)
├── build/
│   ├── prueba.r1cs
│   ├── prueba.wasm
│   └── (archivos de compilación)
├── zkbuild/
│   ├── input.json
│   ├── proof.json
│   ├── public.json
│   ├── verification_key.json
│   ├── prueba_final.zkey
│   ├── verificar.js
│   ├── index.html
│   ├── script.js
│   └── (otros archivos necesarios)
├── DOC.md
└── README.md
```
