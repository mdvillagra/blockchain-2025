# Marketplace de NFTs

Este proyecto es un marketplace de NFTs dividido en dos partes: `smart_contracts/` y `web_app/`. Ambas se encuentran dentro del directorio principal `dapp/`.

## Pasos para ejecutar el proyecto

### 1. Configurar y preparar `smart_contracts/`

- Dentro del directorio `smart_contracts/`, crea un archivo `.env` con el siguiente contenido:

```env
PRIVATE_KEY="tu_clave_privada_de_metamask"
```

- Luego, ejecuta:

```bash
npm install
```

---

### 2. Configurar y ejecutar `web_app/`

- Dentro del directorio `web_app/`, crea un archivo `.env` con el siguiente contenido:

```env
VITE_CONTRACT_ADDRESS=0xF1B2BB564c61c25ac4DECf2640CE220cF267cE63
```

- Luego, ejecuta:

```bash
npm install
npm run dev
```
