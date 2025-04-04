## Instalar Circom
Ir al link (circom) [https://docs.circom.io/getting-started/installation/] y seguir los pasos de instalacion necesarios.
## Instalar snarkjs para generar y validad pruebas ZK
``npm install -g snarkjs`` 
## Compilar el circuito Circom a WebAssembly
- Ejecutar:
```circom circuito.circom --r1cs --wasm --sym``` y navegar al directorio creado ```cd circuito_js```

- Una vez en el directorio, se debe ejecutar el setup de las pruebas y de la verificacion (que se encuentra en la raiz del proyecto) dentro de la carpeta generada ``circuito_js`` 
```cmd
../setup.sh
```
- Luego ejecutar el script ``run_pruebas.sh`` (que se encuentra en la raiz del proyecto) dentro de la carpeta generada circuito_js que contiene las configuraciones de la creacion del witness y verificacion de las pruebas.

```cmd
../run_pruebas.sh
```

Obs: solo se puede ejecutar este script de pruebas si se desea, ya que el setup ya esta implementado.

- Opcional: si desea puede ejecutar el archivo map_public.js, de manera a colocar los labels de las variables a la salida o exposicion de los valores publicos y el resultado se generara en un archivo llamado ``public_result_(i)`` en la carpeta output.

```node map_public.js```
- Puede ejecutar el verificador en nodejs ``node verify.js`` dentro del directorio raiz del proyecto o en el navegador con el index.hml (puede exponerlo con la extension de live server de vscode).