# Instrucciones de Compilación y Ejecución

## Requisitos previos

- **Node.js** (v22.14.0)
- **circom** (instalado globalmente v2.2.2)
- **snarkjs** (instalado globalmente v0.7.5)

## Pasos para ejecutar el proyecto

### 1. Configuración inicial (`configuracion.sh`)
Configura el entorno y genera los archivos necesarios:

  - Compila el circuito corto.circom

  - Descarga el archivo ptau (trusted setup)

  - Genera las claves zKey y el archivo de verificación
  

```bash
chmod +x configuracion.sh
./configuracion.sh
```

### 2. Generación de pruebas (`generar.js`)

Genera pruebas zk-SNARK para cada entrada en entradas.json:

  - Crea directorios para pruebas y datos públicos

  - Procesa cada entrada del archivo entradas.json

  - Genera las pruebas en /pruebas/

  - Guarda los datos públicos en /publicos/

```bash
node generar.js
```

### 3. Verificación de pruebas (`verificar.js`)

Verifica todas las pruebas generadas:

- Lee los archivos públicos de /publicos/

- Verifica cada prueba correspondiente en /pruebas/

- Muestra resultados de validación en consola

```bash
node verificar.js
```

## Orden de ejecución obligatorio
1. `configuracion.sh`
2. `generar.js`
3. `verificar.js`

