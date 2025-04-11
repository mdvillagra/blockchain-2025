
#  zk-SNARKs con Circom y SnarkJS: Verificación de (a² + b²) % p

Este proyecto demuestra cómo construir y verificar una **prueba de conocimiento cero (ZK-Proof)** para la operación matemática:

```
c = (a² + b²) mod p
```

Donde:
- `a` y `b` son **entradas privadas** conocidas por el usuario
- `p` es un número primo **público**
- `c` es el resultado **público**, verificado sin revelar los valores secretos

---

##  Estructura del Proyecto

```
zk-proyecto/
├── circuit/
│   ├── square_sum_mod.circom   # Circuito Circom
│   └── input.json              # Entradas privadas a y b
├── build/                      # Archivos generados por circom y snarkjs
├── pot12_final.ptau            # Powers of Tau (fase 2)
├── zk_proceso.sh               # Script de automatización
└── README.md                   # Este documento
```

---

##  Requisitos

- Ubuntu (via WSL o nativo)
- Node.js ≥ v16
- [`circom`](https://docs.circom.io/getting-started/installation/)
- [`snarkjs`](https://github.com/iden3/snarkjs)

```bash
# Instalar snarkjs globalmente
npm install -g snarkjs
```

---

## Generar `pot12_final.ptau` (una vez)

```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Primer aporte" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

---

##  Circuito: `square_sum_mod.circom`

```circom
pragma circom 2.0.0;

template SquareSumMod(p) {
    signal input a;
    signal input b;
    signal output c;

    signal a_squared;
    signal b_squared;
    signal sum;
    signal q;
    signal qp;

    a_squared <== a * a;
    b_squared <== b * b;
    sum <== a_squared + b_squared;

    qp <== q * p;
    c <== sum - qp;

    sum === qp + c;
}

component main = SquareSumMod(97);
```

---

##  Entrada de prueba

 `circuit/input.json`

```json
{
  "a": 3,
  "b": 4
}
```

> Resultado esperado: `a² + b² = 9 + 16 = 25` → `25 mod 97 = 25`

---

## Ejecución automática

Usá el script preparado:

```bash
./zk_proceso.sh
```

Este script:

1. Limpia la carpeta `build/`
2. Compila el circuito (`.r1cs`, `.wasm`, `.sym`)
3. Configura la ceremonia con `.ptau` y genera `.zkey`
4. Exporta la clave de verificación
5. Genera el testigo (`witness.wtns`)
6. Genera y verifica la prueba (`proof.json`, `public.json`)

---

##  Resultado final

Salida esperada al final del script:

```
📤 Resultado público:
["25"]
🎉 ¡Todo correcto! La prueba fue verificada con éxito.
```

---

##  Casos de prueba recomendados

| a | b | a² + b² | mod 97 | Resultado esperado |
|---|---|---------|--------|--------------------|
| 3 | 4 | 9 + 16  | 25     | 25                 |
| 10| 5 | 125     | 28     | 28                 |
| 8 | 6 | 100     | 3      | 3                  |
| 9 | 2 | 85      | 85     | 85                 |

---

##  ¿Qué sigue?

- Agregar validaciones tipo `c < p`
- Exportar verificador a Solidity (para blockchain)
- Integrar en una app web (browser)

---

## Créditos

Proyecto realizado por **Manuel Leguizamon** 
Basado en herramientas de [iden3](https://github.com/iden3).

---

