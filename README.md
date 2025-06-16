# NFT Marketplace DApp - Parcial 2 Blockchain

Este proyecto es un mercado descentralizado de NFTs (DApp) desarrollado como parte del segundo parcial de la asignatura Blockchain de la Facultad Politécnica, Universidad Nacional de Asunción. Permite a los usuarios ver NFTs a la venta, conectar su billetera MetaMask, comprar NFTs y mintear un lote inicial de NFTs.

**Integrantes del Grupo:**
* Marcelo Andre Pauls Toews
* Andres Moises Roman Medina

##  Funcionalidades Principales

* Conectar billetera MetaMask. [cite: 5]
* Visualizar NFTs listados para la venta. [cite: 1]
* Comprar NFTs.
* Mintear un lote inicial de NFTs para poblar el mercado (requiere una sola confirmación en MetaMask gracias al minteo por lotes).
* Los vendedores pueden retirar los fondos acumulados por sus ventas.
* Actualización de la UI en tiempo real tras una compra sin recargar la página.

##  Tecnologías Utilizadas

* **Blockchain:** Ethereum (Ephemery Testnet) [cite: 3]
* **Smart Contracts:** Solidity, Hardhat [cite: 7]
* **Frontend:** React, Vite, ethers.js (v6.x) [cite: 2, 8]
* **Billetera:** MetaMask [cite: 5]
* **Estándar de Token:** ERC-721 (utilizando `ERC721URIStorage` de OpenZeppelin)

##  Configuración y Puesta en Marcha

Para ejecutar este proyecto, necesitarás configurar tanto el entorno de Hardhat (backend) como el de Vite/React (frontend).

### Prerrequisitos

* Node.js (v16 o superior recomendado)
* npm o yarn
* Extensión de navegador MetaMask instalada y configurada con la red Ephemery Testnet.
    * **Nombre de Red:** Ephemery Testnet
    * **Nueva URL RPC:** `https://otter.bordel.wtf/erigon`
    * **ID de Cadena:** (MetaMask lo detectará automáticamente o puedes buscarlo; suele ser un número grande)
    * **Símbolo de Moneda:** ETH (o el que use Ephemery)
* Fondos en ETH de Ephemery Testnet en tu cuenta de MetaMask para desplegar el contrato y realizar transacciones.

### 1. Configuración del Backend (Smart Contract - Hardhat)

Este proyecto asume que el contrato inteligente ya ha sido desplegado. Si necesitas volver a desplegarlo o modificarlo:

1.  **Clona el repositorio** (si aplica, o navega a la carpeta raíz del proyecto Hardhat).
2.  **Navega al directorio raíz del proyecto Hardhat**:
    ```bash
    cd tu-directorio-hardhat
    ```
3.  **Instala las dependencias**:
    ```bash
    npm install
    # o si usas yarn
    # yarn install
    ```
4.  **Crea un archivo `.env`** en el directorio raíz del proyecto Hardhat y añade tu clave privada de Ephemery:
    ```env
    PRIVATE_KEY=TU_CLAVE_PRIVADA_DE_METAMASK_PARA_EPHEMERY
    ```
    *Importante: ¡No compartas tu clave privada con nadie!*
5.  **Compila los contratos** (si has hecho cambios en el código Solidity):
    ```bash
    npx hardhat compile
    ```
6.  **Despliega el contrato** (si necesitas una nueva instancia):
    ```bash
    npx hardhat run scripts/deploy.js --network ephemery
    ```
    Anota la dirección del contrato desplegado para usarla en el frontend.

### 2. Configuración del Frontend (React App - Vite)

1.  **Navega al directorio del frontend**:
    ```bash
    cd web_app
    ```
2.  **Instala las dependencias**:
    ```bash
    npm install
    # o si usas yarn
    # yarn install
    ```
3.  **Crea un archivo `.env`** en el directorio `web_app/` y configura las siguientes variables:

    ```env
    VITE_CONTRACT_ADDRESS=0x5afC58B01752a60fAc2709cd303a48AddCAC4167
    VITE_RPC_URL="https://otter.bordel.wtf/erigon"
    ```
    *Reemplaza `0x5afC58B01752a60fAc2709cd303a48AddCAC4167` con la dirección de tu contrato si has desplegado una nueva instancia.*

### 3. Ejecutar la Aplicación

1.  **Inicia el servidor de desarrollo del frontend** (desde el directorio `web_app/`):
    ```bash
    npm run dev
    # o si usas yarn
    # yarn dev
    ```
2.  Abre tu navegador web y ve a la dirección que te indica la consola (usualmente `http://localhost:5173` o similar).
3.  Asegúrate de que tu MetaMask esté conectado a la red Ephemery Testnet.

##  Uso de la DApp

1.  **Conectar Wallet**: Al cargar la DApp, haz clic en "Conectar Wallet" para enlazar tu cuenta de MetaMask.
2.  **Mintear Lote Inicial (Opcional/Admin)**: Si el mercado está vacío (o eres el administrador/dueño del contrato, dependiendo de cómo se haya configurado `batchMintAndList`), puedes usar el botón "Mint & List Inicial (10 NFTs)" para crear y listar 10 NFTs de ejemplo en una sola transacción.
3.  **Ver NFTs**: Los NFTs disponibles para la venta se mostrarán en la página principal.
    * *Nota sobre metadatos*: Las imágenes y nombres de los NFTs dependerán de las URIs de metadatos proporcionadas durante el minteo.
4.  **Comprar un NFT**:
    * Si estás conectado con una cuenta que no es la vendedora del NFT, verás el botón "Comprar".
    * Al hacer clic, MetaMask te pedirá confirmar la transacción y pagar el precio más el gas.
    * Una vez confirmada la transacción, el NFT desaparecerá de la lista de venta y debería ser visible en la sección "Coleccionables" o "NFTs" de tu MetaMask (asegúrate de que la red Ephemery esté seleccionada en MetaMask y que la URI de metadatos del NFT sea válida y accesible).

##  Dirección del Contrato Desplegado

La instancia del contrato `Marketplace.sol` utilizada para esta DApp está desplegada en la **Ephemery Testnet** en la siguiente dirección:

**`0x5afC58B01752a60fAc2709cd303a48AddCAC4167`**

---