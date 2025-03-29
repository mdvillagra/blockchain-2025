# **DOCUMENTACIÓN DEL PROYECTO**
<br>
<br>

# Estructura del Circuito

## Definición

El circuito opera bajo un número primo **13** público, adecuado para entornos de prueba.

```cricom
var p = 13;
```

### Entradas y Salidas

- **Entradas privadas**: `a`, `b`
- **Salida pública**: `r`

```cricom
signal input a;
signal input b;
signal output r;
```

### Cálculos

1. **Cuadrados de las entradas**  
   Se calculan `a²` y `b²` mediante restricciones cuadráticas.

   ```cricom
   signal a2 <== a * a;
   signal b2 <== b * b;
   ```

2. **Suma de cuadrados**  
   La suma de los cuadrados (`a² + b²`) se trata como una restricción lineal.

   ```cricom
   signal suma <== a2 + b2;
   ```

3. **Reducción módulo 13**  
   Se aplica la operación `mod p` para obtener la salida.

   ```cricom
   r <-- suma % p;
   ```

4. **Cálculo del cociente auxiliar `q`**

   ```cricom
   signal q <-- (suma - r) / p;
   ```

5. **Verificación de consistencia**  
   Se impone la restricción `suma === q * p + r` para asegurar la validez de la salida.

   ```cricom
   suma === q * p + r;
   ```

### Resultado

La salida `r` contiene el valor seguro `(a² + b²) mod 13`, útil en pruebas de conocimiento cero (ZKPs).

---

# Proceso de Generación de Pruebas

### Configuración Inicial

Antes de generar pruebas, se debe configurar el entorno:

1. **Compilación del circuito**  
   ```bash
   circom corto.circom --r1cs --wasm --sym
   ```

2. **Descarga de parámetros PTAU**  
   ```bash
   wget https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_10.ptau -O contribuido.ptau
   ```

3. **Generación de claves zKey**  
   ```bash
   snarkjs groth16 setup corto.r1cs contribuido.ptau claves.zkey
   ```

4. **Exportación de claves de verificación**  
   ```bash
   snarkjs zkey export verificationkey claves.zkey claves.json
   ```

5. **Creación del archivo de entradas**  
   Se debe contar con `entradas.json` con valores de prueba.

### Generación de Pruebas

1. **Preparación del entorno**  
   ```bash
   mkdir publicos pruebas
   ```

2. **Ejecución para cada par de entradas (`X`)**  
   ```bash
   snarkjs groth16 fullprove entradas.json corto_js/corto.wasm claves.zkey pruebas/prueba_X.json publicos/publico_X.json
   ```

---

# Proceso de Verificación

Para cada par `(input público + prueba)` con índice `X`, verificamos con las claves:

```bash
snarkjs groth16 verify claves.json publicos/publico_X.json pruebas/prueba_X.json
```

Si la verificación es correcta, la salida indicará **"Proof is valid"**.

---

# Ejemplos de Uso

### Entrada 1: `a = 3, b = 2`

```circom
a2 <== a * a → 3 * 3 = 9
b2 <== b * b → 2 * 2 = 4
suma <== a2 + b2 → 9 + 4 = 13
r <-- suma % p → 13 % 13 = 0
q <-- (suma - r) / p → (13 - 0) / 13 = 1
suma === q * p + r → 13 === 1 * 13 + 0 → 13 === 13
r = 0 (resultado final)
```

### Entrada 2: `a = 4, b = 1`

```circom
a2 <== a * a → 4 * 4 = 16
b2 <== b * b → 1 * 1 = 1
suma <== a2 + b2 → 16 + 1 = 17
r <-- suma % p → 17 % 13 = 4
q <-- (suma - r) / p → (17 - 4) / 13 = 1
suma === q * p + r → 17 === 1 * 13 + 4 → 17 === 17
r = 4 (resultado final)
```

### Entrada 3: `a = 30, b = 60`

```circom
a2 <== a * a → 30 * 30 = 900
b2 <== b * b → 60 * 60 = 3600
suma <== a2 + b2 → 900 + 3600 = 4500
r <-- suma % p → 4500 % 13 = 2
q <-- (suma - r) / p → (4500 - 2) / 13 = 346
suma === q * p + r → 4500 === 346 * 13 + 2 → 4500 === 4498 + 2 → 4500 === 4500
r = 2 (resultado final)
```

### Entrada 4: `a = -3, b = 2`

```circom
a2 <== a * a → (-3) * (-3) = 9
b2 <== b * b → 2 * 2 = 4
suma <== a2 + b2 → 9 + 4 = 13
r <-- suma % p → 13 % 13 = 0
q <-- (suma - r) / p → (13 - 0) / 13 = 1
suma === q * p + r → 13 === 1 * 13 + 0 → 13 === 13
r = 0 (resultado final)
```

### Entrada 5: `a = -3, b = -2`

```circom
a2 <== a * a → (-3) * (-3) = 9
b2 <== b * b → (-2) * (-2) = 4
suma <== a2 + b2 → 9 + 4 = 13
r <-- suma % p → 13 % 13 = 0
q <-- (suma - r) / p → (13 - 0) / 13 = 1
suma === q * p + r → 13 === 1 * 13 + 0 → 13 === 13
r = 0 (resultado final)
```

### Entrada 6: `a = 0, b = 4`

```circom
a2 <== a * a → 0 * 0 = 0
b2 <== b * b → 4 * 4 = 16
suma <== a2 + b2 → 0 + 16 = 16
r <-- suma % p → 16 % 13 = 3
q <-- (suma - r) / p → (16 - 3) / 13 = 1
suma === q * p + r → 16 === 1 * 13 + 3 → 16 === 16
r = 3 (resultado final)
```

### Entrada 7: `a = 0, b = 0`

```circom
a2 <== a * a → 0 * 0 = 0
b2 <== b * b → 0 * 0 = 0
suma <== a2 + b2 → 0 + 0 = 0
r <-- suma % p → 0 % 13 = 0
q <-- (suma - r) / p → (0 - 0) / 13 = 0
suma === q * p + r → 0 === 0 * 13 + 0 → 0 === 0
r = 0 (resultado final)
```
