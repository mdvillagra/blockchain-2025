# Alumno: Doriham Tadeo Russo Ortega

# Nro CI: 5018972

# Materia: Blockchain - PARCIAL 1

## Verificacion de circuito Circom

- Exponiendo solo el primo p con las variables a y b privadas

Este proyecto implementa un circuito en Circom.

## Detalles del funcionamiento

- Este circuito busca validar lo siguiente c = (a^2 + b^2) % p donde p es un numero primo publico

- Para esto el programa recibe las señales privadas a y b
- y el numero primo publico P

lo que se valida dentro del circuito es que se cumpla la regla del cociente donde C = D.q + K

## Requisitos

- Node.js

## Para ejecutar

1. Correr el script setup.sh
   - Este script genera un pipeline asitido para correr las pruebas en los archivos

```javascript
test_data.json;
test_data_2.json;
test_data_3.json;
```

2. Se deberia ver el mensaje de salida de snarkjs -> OK si todo sale bien despues de cada prueba
3. De ser necesario se puede cambiar los valores de los archivos de prueba y volver a correr el script
