#Actividad 1. Parcial 1

Integranes: Marcelo Andre Pauls Toews, Andres Moises Roman Medina
Materia: Teoría y Aplicaciones de Blockchain
Primer Parcial

## Descripción

Este proyecto implementa un circuito en Circom que verifica que un usuario conoce dos valores secretos `a` y `b`, tales que:

    c = (a² + b²) mod p

Donde `p` es un número primo público y `c` es la salida pública.

---

## Archivos incluidos

- `primerParcial.circom` → Circuito en lenguaje Circom
- `input.json` → Archivo con los valores de entrada para probar el circuito
- `run_all.sh` → Script en Bash que realiza toda la ejecución (compilación, generación del test, prueba y verificación)
- `README.txt` → Este archivo

---

## Requisitos

- Node.js y npm instalados
- Circom instalado (`cargo install --git https://github.com/iden3/circom`)
- snarkjs instalado globalmente:  
  ```bash
  npm install -g snarkjs

### Ejecución del proyecto (Todos los scripts estan incluidos en el archivo bash scripts.sh)
Dar permisos de ejecución al script:

```bash
chmod +x run_all.sh
```

Ejecutar el script:

```bash
./run_all.sh
```

- Ingresar un texto aletorio y pular enter

Este script realiza automáticamente todos los pasos:
- Compilar el circuito
- Generar el test (witness)
- Realizar la ceremonia de Powers of Tau
- Generar llaves de prueba/verificación
- Generar la prueba
- Verificar la prueba

i todo es correcto, se mostrará el mensaje:

```
OK!
La prueba es valida
```
