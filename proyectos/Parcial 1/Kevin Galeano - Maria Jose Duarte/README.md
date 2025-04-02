# 🚀 Proyecto de Verificación con Pruebas SNARK

Este proyecto implementa un circuito en **Circom** para verificar la ecuación:

```math
c=\left( a^{2}+b^{2} \right)mod\left( p \right)
```

donde `p` es un número primo público y `a`, `b` son valores secretos. Además, se genera y verifica una **prueba SNARK** utilizando `snarkjs`.

---

## 🔧 Instalación

1️⃣ Clona este repositorio:

```bash
git clone https://github.com/gsmkev/blockchain-assignments-fpuna.git
```

2️⃣ Instala dependencias de Node.js:

```bash
npm install
```

3️⃣ Asegúrate de tener `circom` y `snarkjs` instalados:

```bash
npm install -g snarkjs
```

---

## 🚀 Uso del Proyecto

### 🔹 1. Compilar el circuito

```bash
./run.sh compile
```

Esto genera el archivo `main.wasm` y otros necesarios.

### 🔹 2. Generar la prueba

```bash
./run.sh proof
```

Se generará `prueba.json` y `public.json`.

### 🔹 3. Verificar la prueba

```bash
./run.sh verify
```

Si la prueba es válida, verás:  
✅ **La prueba es válida.**

### 🔹 4. Utilizar el verificador (en Node.js y en el navegador)

```bash
./run.sh verify-node
```

Si la prueba es válida, verás en la terminal:  
✅ **La prueba es válida.**

O en tu navegador en `http://localhost:8080` puedes apretar el botón de "Iniciar verificación" y verás:  
✅ **La prueba es válida.**

---

## 🛠 Dependencias

- **snarkjs** `0.7.5` → Para generar y verificar pruebas SNARK.
- **concurrently** `9.1.2` → Para ejecutar comandos simultáneamente.
- **http-server** `14.1.1` → Para servir archivos en el navegador.
- **opn-cli** `4.1.0` → Para abrir el navegador automáticamente.

---

## 🎯 Créditos

Proyecto desarrollado para la asignatura de **Blockchain** en FPUNA. 🚀
