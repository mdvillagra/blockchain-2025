# Primer Parcial - Blockchain

### Integrantes
- Fabrizio Roman
- Esteban Fernandez

### Requisitos:
- **Node.js** [Pagina Oficial](https://nodejs.org/en/download)

- **Circom 2** [Repositorio Oficial](https://github.com/iden3/circom)

- **Snarkjs** [Repositorio Oficial](https://github.com/iden3/snarkjs)

- **Servidor local (opcional, para la verificación en navegador)**

  - Puedes usar el paquete `serve` de npm a través de npx para levantar un servidor local. Por ejemplo: `npx serve`.

  - También puedes usar la extension Live Server en Visual Studio Code

**Instalar dependencias:**  
   ```bash
   npm install
   ```    

### Instrucciones de Ejecución:

**Valores de entradas**
- Puedes modificar el archivo input.json para probar diferentes valores de entrada.


**Ejecutar el script de construcción y verificación (build.sh)**

- Antes de ejecutar, asegúrate de que build.sh tenga permisos de ejecución. Si no los tiene, otórgalos con: 
  ```bash
  chmod +x build.sh
  ```
- Luego, ejecuta: 
  ```bash
  ./build.sh
  ```


**Verificar la prueba en Node.js**

- En la raíz del proyecto, ejecuta:
  ```bash
  node verify.js
  ```

**Verificar la prueba en el navegador**

- Navega a la carpeta web: 
    ```bash
    cd web
    ```

- Levanta un servidor local (por ejemplo, usando serve): 
    ```bash
    npx serve .
    ```

- Abre la URL que se muestre (por ejemplo, http://localhost:3000) en tu navegador.

- En la página, haz clic en el botón "Verificar prueba". La página mostrará "Prueba válida" si la verificación es exitosa.