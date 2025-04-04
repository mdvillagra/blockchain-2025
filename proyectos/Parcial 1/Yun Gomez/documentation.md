/**
 * ### Documentación del Circuito `SquareSumMod`
 *
 * #### Estructura del Circuito
 * Este circuito implementa una operación matemática que calcula la suma de los cuadrados de dos números de entrada (`a` y `b`), 
 * y luego obtiene el resultado módulo un número primo `p`. La estructura incluye:
 * - **Entradas privadas**:
 *   - `a`: Primer número de entrada.
 *   - `b`: Segundo número de entrada.
 * - **Salida pública**:
 *   - `c`: Resultado de `(a² + b²) % p`.
 * - **Variables intermedias**:
 *   - `a_sq`: Cuadrado de `a`.
 *   - `b_sq`: Cuadrado de `b`.
 *   - `sum`: Suma de los cuadrados (`a² + b²`).
 *   - `sum_mod_p`: Resultado de `sum % p`.
 * 
 * El circuito utiliza las siguientes operaciones:
 * 1. Calcula los cuadrados de `a` y `b`.
 * 2. Suma los cuadrados.
 * 3. Calcula el módulo `p` de la suma.
 * 4. Verifica que el cálculo del módulo es correcto mediante restricciones adicionales.
 * 5. Asigna el resultado del módulo a la salida pública `c`.
 *
 * #### Proceso de Generación de Pruebas
 * 1. **Compilación del circuito**: Se utiliza el comando `circom "$CIRCUIT_NAME.circom" --r1cs --wasm --sym` para compilar el archivo `.circom` y generar:
    - El archivo `.r1cs` que contiene el sistema de restricciones de rango.
    - El archivo `.wasm` necesario para la generación de testigos.
    - El archivo de símbolos `.sym` para depuración.
 * 2. **Generación de testigos**: 
    - Se solicita al usuario los valores de las entradas privadas (`a` y `b`) mediante `read A` y `read B`.
    - Se crea un archivo `input.json` con los valores de entrada utilizando un bloque `cat` con contenido JSON.
    - El comando `node "$CIRCUIT_NAME"_js/generate_witness.js "$CIRCUIT_NAME"_js/"$CIRCUIT_NAME".wasm input.json witness.wtns` genera el archivo `witness.wtns`, que contiene los valores intermedios y la salida pública (`c`).
 * 3. **Configuración de la prueba**:
    - Se generan los parámetros de confianza iniciales con `snarkjs powersoftau new bn128 12 pot12_0000.ptau -v`.
    - Se realiza una contribución a los parámetros con `snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v`.
    - Los parámetros se preparan para la fase 2 con `snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v`.
    - Se genera la clave de prueba inicial con `snarkjs groth16 setup "$CIRCUIT_NAME.r1cs" pot12_final.ptau "$CIRCUIT_NAME"_0000.zkey`.
    - Se realiza una contribución adicional a la clave de prueba con `snarkjs zkey contribute "$CIRCUIT_NAME"_0000.zkey "$CIRCUIT_NAME"_0001.zkey --name="1st Contributor" -v`.
    - Finalmente, se exporta la clave de verificación pública con `snarkjs zkey export verificationkey "$CIRCUIT_NAME"_0001.zkey verification_key.json`.
 * 4. **Generación de la prueba**: 
    - Se utiliza el comando `snarkjs groth16 prove "$CIRCUIT_NAME"_0001.zkey witness.wtns proof.json public.json` para generar:
        - `proof.json`: Contiene la prueba de conocimiento cero.
        - `public.json`: Contiene los valores públicos derivados de las entradas privadas.
 * 5. **Verificación de la prueba**: 
    - Se ejecuta el comando `snarkjs groth16 verify verification_key.json public.json proof.json` para verificar que la prueba es válida, asegurando que los cálculos se realizaron correctamente sin revelar las entradas privadas.
 *
 * #### Proceso de Verificación
 * 1. El verificador recibe la prueba generada y la salida pública `c`.
 * 2. Utilizando la clave de verificación generada durante la configuración del circuito, el verificador comprueba que la prueba es válida.
 * 3. Si la prueba es válida, se garantiza que los cálculos se realizaron correctamente sin necesidad de conocer las entradas privadas.
 * #### Implementaciones de Verificación
 * - **Verificación en el Navegador**:
    - El archivo `verify.html` proporciona una interfaz gráfica para verificar pruebas directamente en el navegador.
    - Utiliza la biblioteca `snarkjs` para cargar los archivos `verification_key.json`, `proof.json` y `public.json`.
    - Al hacer clic en el botón "Verificar Prueba", se ejecuta la función `verifyProof()` que realiza la verificación y muestra el resultado en la página.
    - Este método es útil para demostraciones rápidas y accesibles a través de una interfaz web.
    - **Instrucciones para probar**:
        1. Asegúrate de tener los archivos `verification_key.json`, `proof.json` y `public.json` generados previamente.
        2. Abre el archivo `verify.html` en un navegador web compatible.
        3. Carga los archivos mencionados utilizando los botones de carga en la interfaz.
        4. Haz clic en el botón "Verificar Prueba" para realizar la verificación.
        5. Observa el resultado de la verificación en la página.

 * - **Verificación en Node.js**:
    - El archivo `verify.js` permite realizar la verificación de pruebas en un entorno de servidor o local utilizando Node.js.
    - La función `verifyProof()` utiliza `snarkjs` para realizar la verificación y muestra el resultado en la consola.
    - Este método es ideal para integraciones en sistemas backend o automatización de procesos de verificación.
    - **Instrucciones para probar**:
        1. Asegúrate de tener los archivos `verification_key.json`, `proof.json` y `public.json` generados previamente.
        2. Instala las dependencias necesarias ejecutando `npm install snarkjs` en el directorio del proyecto.
        3. Ejecuta el archivo `verify.js` con Node.js utilizando el comando `node verify.js`.
        4. Observa el resultado de la verificación en la consola.

 *
 * #### Ejemplos de Uso
 * - **Ejemplo 1**:
 *   - Entradas: `a = 3`, `b = 4`, `p = 23`.
 *   - Cálculos:
 *     - `a² = 9`, `b² = 16`.
 *     - `sum = 9 + 16 = 25`.
 *     - `sum_mod_p = 25 % 23 = 2`.
 *   - Salida: `c = 2`.
 * - **Ejemplo 2**:
 *   - Entradas: `a = 5`, `b = 7`, `p = 23`.
 *   - Cálculos:
 *     - `a² = 25`, `b² = 49`.
 *     - `sum = 25 + 49 = 74`.
 *     - `sum_mod_p = 74 % 23 = 5`.
 *   - Salida: `c = 5`.
 *

