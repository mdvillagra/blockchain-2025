
# Alumno: Hugo Daniel Bareiro Olmedo

# Nro CI: 4456236

# Materia: Blockchain - PARCIAL 1

## Verificación de Suma de Cuadrados con Pruebas de Conocimiento Cero

  

Este proyecto implementa un circuito en Circom.

  

## Contenido general del Proyecto

-  **circuit.circom**: Código del circuito Circom.

-  **input.json**: Archivo de ejemplo con los valores de entrada.

-  **witness.wtns**: Archivo generado que contiene el testigo (witness).

-  **ptau**: Archivos del setup confiable (por ejemplo, `pot12_0000.ptau`, `pot12_final.ptau` y `pot12_prep.ptau`).

-  **circuit_0000.zkey y circuit_final.zkey**: Archivos intermedios y finales de la configuración del sistema Groth16.

-  **verification_key.json**: Clave de verificación exportada a partir del zkey.

-  **proof.json** y **public.json**: Archivos con la prueba generada y las señales públicas.

-  **verify.js**: Script en Node.js para verificar la prueba.

  

## Requisitos

  

- Node.js

- NPM

- Circom 2.2.2 (o version similar)

- snarkjs

  

## Instrucciones (Windows)

  

### 1. Compilación del Circuito

Ubicate en el directorio raíz del proyecto, donde se encuentra el archivo circom y ejecuta:

    circom circuit.circom --r1cs --wasm --sym
    
### 2. Creación del Archivo de Entradas

Crea un archivo `input.json` en la raíz del proyecto con un formato similar, por ejemplo:

    {
  "a": 6,
  "b": 1,
  "p": 7,
  "q": 5,
  "c": 2
}

### 3. Generación del Witness

Ejecuta el siguiente comando para generar el witness:

    node circuit_js/generate_witness.js circuit_js/circuit.wasm input.json witness.wtns

### 4. Trusted Setup

Realiza el setup confiable. Si no se tiene un archivo .ptau, seguir estos pasos:

1.  Crear el archivo inicial:

    snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

2. Contribuir al proceso:

    snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau --name="contribución" -v

3. Preparar la fase 2:

    snarkjs powersoftau prepare phase2 pot12_final.ptau pot12_prep.ptau -v

### 5. Configurar el Sistema de Pruebas (Groth16)

Ejecutar individualmente estos comandos:

    snarkjs groth16 setup circuit.r1cs pot12_prep.ptau circuit_0000.zkey

    snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="final" -v

    snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

### 6. Generación y Verificación de la Prueba

Para crear la prueba y extraer las señales públicas, ejecutar:

    snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json

Y para verificar:

    snarkjs groth16 verify verification_key.json public.json proof.json

### 7. Verificador en Node.js

En la raíz del proyecto, se encuentra `verify.js` . Para ejecutar el script, asegurarse de instalar las dependencias correctas con los comandos:

    npm init -y

    npm install snarkjs

Luego, ejecutar el script:

    node verify.js

Para verificar correctamente el proyecto.
