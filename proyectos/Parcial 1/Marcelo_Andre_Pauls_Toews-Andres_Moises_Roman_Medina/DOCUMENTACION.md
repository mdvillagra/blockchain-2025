#Actividad 1. Parcial 1

Integranes: Marcelo Andre Pauls Toews, Andres Moises Roman Medina
Materia: Teoría y Aplicaciones de Blockchain
Primer Parcial

## 1. Estructura del circuito

Este proyecto implementa un circuito en Circom que verifica que un usuario conoce dos valores secretos `a` y `b` tales que:

```
c = (a² + b²) mod p
```

Donde:
- `a` y `b` son entradas privadas
- `p` es una entrada pública
- `c` es la salida pública

### Código del circuito

```circom
template Check() {
    signal input a;
    signal input b;
    signal input p;
    signal output c;

    signal a2;
    signal b2;
    signal sum;
    signal q;

    a2 <== a * a;
    b2 <== b * b;
    sum <== a2 + b2;

    c + p * q === sum;
}

component main {public [p]} = Check();
```

Este circuito calcula `a² + b²`, realiza la operación `mod p` usando una variable auxiliar `q`, y expone el resultado `c` como salida pública sin revelar los valores privados.

## 2. Proceso de generación de pruebas

### 1. Compilar el circuito

```bash
circom primerParcial.circom --r1cs --wasm --sym -o build
```

Esto genera:
- `.r1cs`: descripción del circuito
- `.wasm`: código para generar el test (witness)
- `.sym`: simbología para depuración

### 2. Generar el test (witness)

```bash
node build/primerParcial_js/generate_witness.js build/primerParcial_js/primerParcial.wasm input.json witness.wtns
```

Esto ejecuta el circuito con los valores de entrada del archivo `input.json` y genera el archivo `witness.wtns`.

### 3. Ceremonia de configuración confiable (Powers of Tau)

```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="estudiante" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

Esto genera una configuración compartida segura para el circuito.

### 4. Configuración específica del circuito

```bash
snarkjs groth16 setup build/primerParcial.r1cs pot12_final.ptau primerParcial.zkey
snarkjs zkey export verificationkey primerParcial.zkey verification_key.json
```

Esto genera:
- `.zkey`: llave de prueba
- `verification_key.json`: llave pública de verificación

### 5. Generar la prueba

```bash
snarkjs groth16 prove primerParcial.zkey witness.wtns proof.json public.json
```

Esto crea:
- `proof.json`: contiene la prueba criptográfica
- `public.json`: contiene los valores públicos (`p`, `c`) usados para verificar

## 3. Proceso de verificación

La verificación se realiza con el siguiente comando:

```bash
snarkjs groth16 verify verification_key.json public.json proof.json
```

Si la prueba es válida, se mostrará:

```
OK!
```

Esto indica que el usuario conoce valores `a` y `b` válidos, sin haberlos revelado.

## 4. Ejemplos de uso

### Archivo input.json

```json
{
  "a": 3,
  "b": 4,
  "p": 23
}
```

### Resultado esperado

```
a² + b² = 9 + 16 = 25
25 mod 23 = 2
```

### Archivo public.json

```json
["23", "2"]
```