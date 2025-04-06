## Rust
Instalar la dependencia Rust

```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

## Circom
Instalar circom 
```
git clone https://github.com/iden3/circom.git
```

Dentro de la carpeta circom

```
cargo build --release
cargo install --path circom
```
## Snarkjs
Instalar snarkjs

```
npm install -g snarkjs
```

## Correr el script con build.sh en la carpeta raiz
```
./build.sh
```

## Verificaciones
Navegar a la carpeta verificador

Para verificar con node:

```
npm install
node verify.js
```

Para verificar en html desde windows:

```
explorer.exe verificador.html
```

cargar los archivos correspondientes y dar verificar

## Link a la documentación
[documentación](https://docs.google.com/document/d/12tqRcphV9gW-aajoFstfN6HqESrQ_XHOyFbBcnw6gC0/edit?usp=sharing)