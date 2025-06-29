# 🔐 Proyecto con Circom y SnarkJS

El proyecto contiene un circuito escrito en Circom 2.0 que calcula el resultado de la suma de los cuadrados de dos valores, el cual es módulo de un número primo `p`. También incluye un script Bash para instalar todas las dependencias del proyecto, compilar el circuito y generar el testigo.


## 📁 Estructura del Proyecto

- `square_sum_mod.circom` — Circuito principal.
- `input.json` — Entradas al circuito.
- `compilation.sh` — Script que automatiza toda la compilación, prueba y verificación posterior.
- `.zkey`, `.ptau`, `.wasm`, `.r1cs` — Archivos necesarios para generar y verificar pruebas.

## ⚙️ Requisitos Previos

- Sistema basado en Debian/Ubuntu
- Acceso a `sudo`
- `bash`, `curl`, `git` preinstalados
- Node.js
- SnarkJS
- Circom

## 🛠️ Cómo ejecutar el proyecto

### 1. Dar permisos de ejecución al script

chmod +x compilation.sh
chmod +x clean.sh

### 2. Ejecutar el script clean.sh para borrar los datos anteriores

sudo bash clean.sh

### 2. Ejecutar el script que gestiona toda el proyecto

sudo bash compilation.sh

## ⚙️ ¿Qué hace el script `compilation.sh`?

1. **Verifica e instala Node.js y npm**
   - Si no están presentes, los instala usando el gestor de paquetes del sistema.

2. **Verifica e instala Circom**
   - Clona el repositorio oficial de Circom.
   - Compila con `cargo` y mueve el ejecutable al PATH.

3. **Verifica e instala SnarkJS**
   - Usa `npm` para instalar la herramienta de pruebas ZK `snarkjs`.

4. **Compila el circuito `square_sum_mod.circom`**
   - Genera archivos `.r1cs`, `.wasm`, `.sym`.

5. **Mueve el archivo `.wasm` al directorio raíz del proyecto**
   - Este archivo es necesario para generar el testigo.

6. **Genera el testigo (`witness.wtns`)**
   - Utiliza `snarkjs` para calcularlo a partir de un archivo `input.json`.

7. **Exporta el testigo a un archivo `.json` (`output.json`)**
   - Para inspección o validación manual.