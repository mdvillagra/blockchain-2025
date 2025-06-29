# Proyecto: Verificación de Pruebas de Conocimiento Cero (ZKP)

Este repositorio contiene un proyecto completo para la generación y verificación de pruebas de conocimiento cero (ZKP) utilizando el circuito `SquareSumMod`.
## Estructura del Repositorio

El repositorio incluye los siguientes archivos:

1. **`circuit.circom`**: Define el circuito `SquareSumMod`, que calcula la suma de los cuadrados de dos números y obtiene el resultado módulo un número primo `p`.
2. **`run_zkp.sh`**: Script Bash para automatizar el proceso de generación de pruebas ZKP, desde la compilación del circuito hasta la verificación de la prueba.
3. **`clean.sh`**: Script Bash para limpiar los archivos generados durante el proceso de pruebas.
4. **`verify.html`**: Interfaz web para verificar pruebas ZKP en el navegador utilizando la biblioteca `snarkjs`.
5. **`verify.js`**: Script Node.js para verificar pruebas ZKP en un entorno local o backend.
6. **`documentation.md`**: Documentación detallada del circuito y del proceso de generación y verificación de pruebas.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas y dependencias:

- [Node.js](https://nodejs.org/).
- [npm](https://www.npmjs.com/) para instalar paquetes de Node.js.
- [circom](https://docs.circom.io/getting-started/installation/) para compilar circuitos.
- [snarkjs](https://github.com/iden3/snarkjs) para generar y verificar pruebas ZKP.
- Un navegador web moderno para probar la interfaz `verify.html`.

## Instrucciones de Uso

### 1. Compilación y Generación de Pruebas


1. Asegurarse de que los scripts `run_zkp.sh` y `clean.sh` tengan permisos de ejecución:
    ```bash
    chmod +x run_zkp.sh clean.sh
    ```

3. Ejecuta el script `run_zkp.sh` para compilar el circuito, generar las pruebas y verificar la prueba:
    ```bash
    ./run_zkp.sh
    ```

    Durante la ejecución, se te pedirá que ingreses los valores de las entradas privadas `a` y `b`. Por ejemplo:
    ```
    Introduce el valor de a (entrada privada):
    3
    Introduce el valor de b (entrada privada):
    4
    ```

4. Si todo se ejecuta correctamente, verás un mensaje indicando si la prueba es válida.

### 2. Limpieza de Archivos Generados

Para eliminar todos los archivos generados durante el proceso de pruebas, ejecuta el script `clean.sh`:


### 3. Verificación de Pruebas

#### Verificación en el Navegador

1. Abre el archivo `verify.html` en un navegador web moderno.
2. Carga los archivos generados previamente (`verification_key.json`, `proof.json`, y `public.json`) utilizando los botones de carga en la interfaz.
3. Haz clic en el botón "Verificar Prueba".
4. Observa el resultado de la verificación en la página. Si la prueba es válida, se mostrará un mensaje indicando que la prueba fue verificada correctamente.

#### Verificación en Node.js

1. Asegurarse de tener los archivos `verification_key.json`, `proof.json`, y `public.json` generados previamente.
2. Instala las dependencias necesarias ejecutando:
    ```bash
    npm install snarkjs
    ```
3. Ejecuta el archivo `verify.js` con Node.js utilizando el siguiente comando:
    ```bash
    node verify.js
    ```
4. Observa el resultado de la verificación en la consola. Si la prueba es válida, se mostrará un mensaje indicando que la prueba es válida junto con el valor de la salida pública.
