# Primer Parcial - Blockchain

### Integrantes
- Fabrizio Roman
- Esteban Fernandez

### Requisitos:
**Node.js**

- Instala Node siguiendo las instrucciones de la pagina oficial (https://nodejs.org/en/download)

**Circom 2**

- Instala Circom 2 siguiendo las instrucciones en el repositorio oficial (https://github.com/iden3/circom).

**Snarkjs**

- Instala snarkjs en el proyecto siguiendo las instrucciones en el repositorio oficial (https://github.com/iden3/snarkjs)

**Servidor local (opcional, para la verificación en navegador)**

- Puedes usar el paquete `serve` de npm a través de npx para levantar un servidor local. Por ejemplo: `npx serve`.

- También puedes usar la extension Live Server en Visual Studio Code

**Instalar dependencias:**  
   ```bash
   npm install
   ```    

### Instrucciones de Ejecución:

**Valores de entradas**
- Puedes modificar el archivo input.json para probar diferentes valores de entrada.


**Ejecutar el script de construcción y verificación (build.sh)**

- Antes de ejecutar, asegúrate de que build.sh tenga permisos de ejecución. Si no los tiene, otórgalos con: `chmod +x build.sh`

- Luego, ejecuta: `./build.sh`

  El script realizará los siguientes pasos:

  - Compilará `circuito.circom`, generando los archivos `.r1cs`, `.wasm` y `.sym`.
  - Generará el testigo (`witness.wtns`) usando `input.json`.
  - Configurará la ceremonia de confianza (Powers of Tau) y preparará los parámetros.
  - Ejecutará el setup de Groth16 (generación de zkeys) y exportará `verification_key.json`.
  - Generará la prueba (`proof.json` y `public.json`).
  - Verificará la prueba generada.
  - En la carpeta `web` copiará los archivos `verification_key.json`, `proof.json` y `public.json`.


**Verificar la prueba en Node.js**

- En la raíz del proyecto, ejecuta: node verify.js

- El script leerá verification_key.json, proof.json y public.json, y mostrará en la consola si la prueba es válida o no.

**Verificar la prueba en el navegador**

- Navega a la carpeta web: cd web

- Levanta un servidor local (por ejemplo, usando serve): npx serve .

- Abre la URL que se muestre (por ejemplo, http://localhost:3000) en tu navegador.

- En la página, haz clic en el botón "Verificar prueba". La página mostrará "Prueba válida" si la verificación es exitosa.