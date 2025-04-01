# Entrega Primer Parcial

Este proyecto implementa un circuito zk-SNARK en Circom para verificar la operación:

```
c = (a² + b²) % p
```

donde:
- `a` y `b` son valores secretos.
- `p` es un número primo público.
- `c` es la salida pública.

## Requisitos

- Node.js
- GNU Make

## Uso

Para preparar el proyecto y luego correrlo entra en la carpeta `src` y corre el siguiente
script que utiliza `make` para realizar las pruebas.

```bash 
make setup
make verify
```

El Makefile instala las dependencias y generara las pruebas de manera automatica.

## Comandos disponibles

### 1. Instalar dependencias y generar pruebas
```bash
make setup
```

### 2. Verificar la prueba generada
Prueba por consola
```bash
make verify
```

Prueba en el navegador
```bash
make browser
```

### 4. Limpiar archivos generados
```bash
make clean
```
