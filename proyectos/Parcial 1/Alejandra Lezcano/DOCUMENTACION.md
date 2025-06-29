
# 📄 Documentación del Circuito – Verificación de Operaciones con Pruebas de Conocimiento Cero

## 🧩 Asignatura: Blockchain  
**Eje Temático:** Criptografía  
**Actividad:** Implementación de circuitos aritméticos en Circom + generación y verificación de ZK-SNARKs  
**Estudiante:** Alejandra Lezcano  


---

## ✅ 1. Estructura del código 

El código se encuentra bien estructurado, modularizado, e incluye comentarios cuando es necesario para la comprensión del flujo lógico. Se utiliza el estándar `pragma circom 2.0.0` y componentes reutilizables de la librería **circomlib** para verificar condiciones de manera segura.

### 📜 Código del circuito (`circuit.circom`)
```circom
pragma circom 2.0.0;

include "node_modules\\circomlib\\circuits\\comparators.circom";

// Verifica si el resto de la división es menor que el módulo
template ModuloCheck() {
    signal input x;
    signal input p;
    signal output is_less;

    component lt = LessThan(32);  // Comparador de 32 bits de circomlib
    lt.in[0] <== x;
    lt.in[1] <== p;
    is_less <== lt.out;
}

// Circuito principal de verificación
template CircuitoVerificacion() {
    signal input a;
    signal input b;
    signal input p;
    signal output c;

    // Calcular a^2 + b^2
    signal a2 <== a * a;
    signal b2 <== b * b;
    signal suma <== a2 + b2;

    // División entera para obtener el cociente
    signal k <-- suma \ p;

    // Multiplicamos cociente por p y restamos para obtener el resto
    signal p_times_k <== p * k;
    signal remainder <== suma - p_times_k;

    // Validación del módulo: remainder < p
    component modCheck = ModuloCheck();
    modCheck.x <== remainder;
    modCheck.p <== p;
    modCheck.is_less === 1;

    // Salida del circuito
    c <== remainder;
}

// Exponer p como entrada pública
component main {public [p]} = CircuitoVerificacion();
```

---

## 📘 2. Funcionamiento 

### 🧠 Propósito del circuito

Este circuito implementa la verificación de la operación:

\[
c = (a^2 + b^2) \mod p
\]

El objetivo es permitirle a un usuario demostrar que conoce los valores secretos `a` y `b` que satisfacen esa operación sin revelar los valores, usando una **prueba de conocimiento cero (ZK-SNARK)**.

### 🔍 Componentes y funciones

- **Entradas privadas:** `a`, `b`
- **Entrada pública:** `p`
- **Salida pública:** `c`

### 🔄 Flujo de cálculo

1. Calcula \( a^2 + b^2 \).
2. Realiza una división entera por `p` para obtener el cociente `k`.
3. Calcula el **resto (módulo)** como `suma - p * k`.
4. Verifica que el resto esté dentro del rango válido: \( 0 \leq c < p \).
5. Devuelve `c` como salida pública.

### ✅ Validaciones incluidas

- Se utiliza el componente `LessThan(32)` de `circomlib` para garantizar que el resultado del módulo (`remainder`) es menor que `p`.
- Se utilizan señales intermedias (`a2`, `b2`, `suma`, `p_times_k`, `remainder`) para mayor claridad y trazabilidad.

---

## ⚙️ 3. Instrucciones 

### 🧩 Requisitos previos

- [Node.js](https://nodejs.org/)
- [Circom](https://github.com/iden3/circom)
- [snarkjs](https://github.com/iden3/snarkjs)
- [circomlib](https://github.com/iden3/circomlib)

### 🛠️ Compilación del circuito 
```bash
circom circuit.circom --r1cs --wasm --sym
```

### 🧾 Ejemplo de entrada (`input.json`)
```json
{
  "a": 3,
  "b": 4,
  "p": 7
}
```

### ⚙️ Generación del testigo
```bash
node circuit_js/generate_witness.js circuit.wasm input.json witness.wtns
```

### 🔐 Generación de claves y prueba
```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau --name="contribuyente" -v

snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="TuNombre" -v

snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json
```

### ✅ Verificación de la prueba
```bash
snarkjs groth16 verify verification_key.json public.json proof.json
```

---

## 📊 4. Ejemplos de uso con valores concretos (1 punto)

### 🎯 Entrada de prueba
```json
{
  "a": 3,
  "b": 4,
  "p": 7
}
```

### 🧮 Cálculo paso a paso
- \( a^2 = 9 \)
- \( b^2 = 16 \)
- \( suma = 25 \)
- \( 25 \mod 7 = 4 \)

### 📤 Salida esperada
```json
["4"]
```

La verificación debería dar como resultado `OK!` si el circuito y la prueba están correctamente generados.

---

### Verificación en Navegador
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


## ✅ Conclusión

Este circuito demuestra cómo se puede usar **criptografía avanzada** para validar operaciones sin revelar datos sensibles. Gracias al uso de **ZK-SNARKs**, es posible garantizar privacidad con verificación matemática sólida y eficiente.
