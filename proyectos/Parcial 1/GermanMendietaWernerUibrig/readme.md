# Presentación
## Integrantes:
- German Mendieta
- Werner Uibrig

# Codigo circom

El código `.circom` define circuitos para realizar cálculos específicos en el contexto de pruebas de conocimiento cero (ZK-SNARKs). Estos circuitos permiten verificar computaciones sin revelar los datos de entrada, asegurando privacidad y seguridad.

El circuito `.circom` implementa una operación matemática que toma dos números de entrada (`a` y `b`), calcula el cuadrado de cada uno, suma estos cuadrados y luego obtiene el resultado módulo un número primo (`p`). Este proceso asegura que el resultado esté dentro del rango definido por el módulo, lo que es útil en aplicaciones criptográficas y de pruebas de conocimiento cero.


# **Configuración y Ejecución**

## **Setup del Proyecto**

### **1. Instalar Dependencias**
Asegúrate de tener instalados:
- **Node.js**: [Descargar aquí](https://nodejs.org)
- **circom** y **snarkjs**: Instálalos globalmente con:
  ```bash
  npm install -g circom snarkjs
  ```

### **2. Configurar el Circuito**
Ejecuta el siguiente comando para configurar el circuito automáticamente:
```bash
node setup_circuit.js
```

Esto realizará los siguientes pasos:
- Compilar el circuito `mod_sum_square.circom`.
- Configurar Powers of Tau y Phase 2.
- Crear las claves para Groth16 y exportar la clave de verificación (`verification_key.json`).

Al finalizar, el script mostrará los resultados de cada paso en la consola.

---

## **Ejecución de Pruebas**

### **1. Preparar Casos de Prueba**
Crea un archivo llamado `test_cases.json` con los valores de prueba. Ejemplo:
```json
[
  {"a": 6, "b": 8},
  {"a": 100, "b": 200},
  {"a": 500, "b": 300}
  ...
]
```

### **2. Ejecutar Pruebas**
Ejecuta el siguiente comando para procesar los casos de prueba y verificar resultados:
```bash
node run_tests.js
```

Este comando generará testigos, pruebas y verificará los resultados para cada caso en `test_cases.json`.

En la salida se podran ver los resultados de la compilacion 

## **Limpieza de Archivos**

El proyecto incluye un script llamado `cleaner.js` que elimina todos los archivos generados durante el proceso de configuración y ejecución de pruebas.

### **Como ejecutar el script de limpieza**

1. **Ejecuta el script desde la terminal:**
   ```bash
   node cleaner.js
   ```
