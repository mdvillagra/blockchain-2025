# Dockerfile
FROM node:18

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Instalar Rust y wasm-pack
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo install wasm-pack

# Instalar circom y dependencias
RUN npm install -g circom2
RUN npm install -g snarkjs
RUN npm install -g circomlib

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos del proyecto directamente a /app
COPY Circuito/ /app/Circuito/
COPY ScriptsZK/ /app/ScriptsZK/
COPY Pruebas/ /app/Pruebas/

# Instalar dependencias del proyecto (si hay package.json)
COPY package*.json /app/
RUN if [ -f "/app/package.json" ]; then npm install; fi

# Puerto expuesto (si es necesario)
EXPOSE 3000

# Comando por defecto (puedes cambiarlo según necesites)
CMD ["tail", "-f", "/dev/null"]