#  TP1 Blockchain - Marketplace NFT

##  Integrantes
- German Mendieta  
- Werner Uibrig

---

##  Descripción

Este proyecto es un **Marketplace de NFTs** desarrollado con **Solidity** y **React**.

Permite:
- Desplegar un contrato ERC721.
- Mintear y comprar NFTs desde una web.

---

##  Estructura del Proyecto

```
/
├── contracts/           # Contratos en Solidity (Marketplace, etc)
├── scripts/             # Scripts de deploy y mint
├── web_app/             # Frontend en React + ethers.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── MarketplaceABI.json
│   │   └── ...
│   └── ...
├── artifacts/           # ABI y bytecode generados por Hardhat
├── prepare_project.js   # Script de preparación y arranque automático
├── .env                 # Variables de entorno del backend
├── web_app/.env         # Variables de entorno del frontend
└── README.md
```

---

## Variables de Entorno

Configura los archivos `.env` en la raíz y en `web_app/` con las claves y endpoints necesarios.

Ejemplo básico:

```env
PRIVATE_KEY=tu_clave_privada
RPC_URL=http://localhost:8545
```

---

##  Preparación y Arranque Automático

Puedes iniciar todo el entorno automáticamente ejecutando:

```bash
node prepare_project.js
```

Este script:

* Compila los contratos.
* Lanza el nodo local de Hardhat en background.
* Despliega el contrato y actualiza los `.env` con la dirección.
* Copia el ABI actualizado al frontend.
* Mintea NFTs iniciales.
* Levanta el frontend (`web_app`).

---

##  Frontend (React)

Ubicado en `/web_app`, desarrollado con:

* **React**
* **ethers.js v6**

Características:

* Conexión/desconexión de wallet.
* Visualización y compra de NFTs.
* Interfaz resiliente: los productos se muestran aunque falle la conexión a la blockchain (la compra se desactiva si no hay provider).

---

##  Tecnologías Usadas

* Node.js
* Hardhat
* Solidity
* React
* ethers.js

---

##  Notas Adicionales

* El script `prepare_project.js` actualiza automáticamente todos los `.env` con la dirección del contrato desplegado.
* El ABI se copia al frontend tras cada deploy.
## Instalación de Dependencias

Antes de ejecutar el proyecto, instala las dependencias necesarias en la raíz y en el frontend:

```bash
npm install
cd web_app
npm install
```

* Puedes editar los productos y precios en el frontend modificando los arrays en `App.jsx`.
