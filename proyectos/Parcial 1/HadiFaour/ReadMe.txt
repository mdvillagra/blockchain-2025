Ejecución del Programa

Este programa puede ejecutarse de dos formas: usando Docker(recomendado) o sin Docker.

1. Ejecución con Docker, se asume que docker está instalado y en ejecución.
----------------------------------
Si prefieres ejecutar el programa con Docker:
- Clona el repositorio
- Ubícate en el mismo nivel que el script "correr_con_docker.sh"
- Dale permisos de ejecución al script con:
    chmod +x correr_con_docker.sh
- Ejecuta el script con:
    ./correr_con_docker.sh


2. Ejecución sin Docker, se asume que todos los requisitos ya estás instalados.
----------------------------------
Para ejecutar el programa sin Docker:
- Clona el repositorio
- Ubícate en el mismo nivel que el script "correr_sin_docker.sh"
- Dale permisos de ejecución al script con:
    chmod +x correr_sin_docker.sh
- Ejecuta el script con:
    ./correr_sin_docker.sh

Requisitos previos (deben estar instalados en tu sistema):
- Node.js
- npm
- circomlib
- WebAssembly (WASM)
- wasm-pack
- Compilador de WASM
- Circom
- Compilador de Circom
- snarkjs
- Rust