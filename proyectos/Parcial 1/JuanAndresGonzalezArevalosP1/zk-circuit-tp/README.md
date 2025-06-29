# Trabajo Práctico 1 - Blockchain

## Autores:  -Juan Andrés González Arevalos => ci -> 5207720  
##           -Pablo Caballero   => ci -> 5170878
Carrera: Ingeniería Informática  
Materia: Blockchain  
Año: 2025

---

## 🔐 Circuito ZK: Verificación de `(a² + b²) mod p` sin revelar `a` ni `b`

Este proyecto implementa un circuito criptográfico en **Circom** que permite verificar la siguiente operación:

c = (a² + b²) mod p


- Donde `a` y `b` son **entradas privadas**
- `p` es un **número primo público** embebido en el circuito (valor: `23`)
- `c` es la **salida pública**

La prueba se genera utilizando **snarkjs** mediante pruebas de conocimiento cero (**ZK-SNARKS**), permitiendo demostrar que se conoce una solución válida sin revelar los datos de entrada.

---

## 📁 Archivos importantes

| Archivo / Script              | Descripción                                                               |
|------------------------------|---------------------------------------------------------------------------|
| `circuit.circom`             | Circuito en Circom                                                        |
| `input.json`                 | Entradas privadas de prueba (`a`, `b`, `q`)                               |
| `compile.sh`                 | Script para compilar el circuito (`.r1cs`, `.wasm`, `.sym`)               |
| `prove.sh`                   | Script para generar la prueba y verificarla con snarkjs                   |
| `verify.sh`                  | Script para verificar rápidamente una prueba ya generada                  |
| `witness.wtns`               | Testigo generado a partir de `input.json`                                 |
| `proof.json` / `public.json`| Prueba ZK y la salida pública                                             |
| `circuit_final.zkey`         | Clave privada del circuito post setup                                     |
| `verification_key.json`      | Clave pública de verificación                                             |

---

## 🚀 Instrucciones de uso

### 1. Compilar el circuito

```bash
./compile.sh

2. Crear archivo input.json con los valores secretos
json
Copiar
Editar
{
  "a": 3,
  "b": 4,
  "q": 1
}
Estos valores cumplen:
a² + b² = 3² + 4² = 9 + 16 = 25

p = 23 (valor fijo en el circuito)

q = ⌊25 / 23⌋ = 1

c = 25 - 1 × 23 = 2

3. Generar la prueba
bash
Copiar
Editar
./prove.sh
Te pedirá ingresar un texto aleatorio dos veces (entropía). Podés escribir cualquier cosa.

4. Verificar la prueba generada
bash
Copiar
Editar
./verify.sh
Deberías ver:

csharp
Copiar
Editar
[INFO] snarkJS: OK!
✅ Tecnologías utilizadas
Circom v2

snarkjs

Node.js v18.19.1

Ubuntu 24.04

📌 Entrega
Este proyecto forma parte del Trabajo Práctico N°1 de la asignatura Blockchain, cuyo objetivo es introducir los conceptos de circuitos aritméticos y pruebas de conocimiento cero mediante herramientas reales de criptografía.

Repositorio para entrega:
https://github.com/mdvillagra/blockchain-2025


