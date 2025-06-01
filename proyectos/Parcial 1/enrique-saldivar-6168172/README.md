# Proyecto de Circuitos Zero Knowledge (ZK) con Circom

## Universidad Nacional de Asunción
**Materia:** Blockchain  
**Estudiante:** Enrique Saldivar - 6168172

## Descripción
Este proyecto implmenta circuitos de pruebas de conocimiento cero utilizando Circom. Las pruebas ZK permiten verificar la validez de una afirmación sin revelar información adicional.

## Requisitos Previos
- Node.js (v18)
- npm (v9)

## Isntalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/xHenrySx/zk-circuit-project.git
cd zk-circuit-project
```

### 2. Instalar dependencias
```bash
curl -Ls https://scrypt.io/scripts/setup-circom.sh | bash
npm install
npm install -g snarkjs
```

### Notas Aducionales
 - Sistemas operativos basados en Unix (Linux, macOS) pueden ejecutar los scripts de bash directamente.
 - Los inputs se generan aleatoriamente durante la generación de la prueba. Numeros de 1 a 10.
 - La validación de numero primo se realiza antes de ingresar al circuito por eficiencia.
 
## Instrucciones de Uso

### 0. Atajo para ejecutar. Si no, siga los pasos a continuación.
Ejecutar directamente
```bash
./scripts/run.sh
```

### 1. Compilar el circuito
Ejecute el siguiente comando para compilar los circuitos:
```bash
./scripts/compile.sh
```

### 2. Generar prueba
Para generar una prueba, ejecute:
```bash
./scripts/generate_proof.sh
```

### 3. Verificar la prueba
Para verificar que la prueba generada es válida:
```bash
./scripts/verify.sh
```

### 4. Ejecutar el verificador
Para ejecutar el verificador en Node.js:
```bash
node verify.js
```