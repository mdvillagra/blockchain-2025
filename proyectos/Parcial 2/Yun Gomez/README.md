# NFT Marketplace DApp

This is a decentralized application (DApp) for an NFT marketplace, built as a college project.
It allows users to connect their Ethereum wallet, view listed NFTs, and purchase them.

**Project Details:**
*   **Institution:** Facultad Politécnica - Universidad Nacional de Asunción (National University of Asunción)
*   **Teacher:** Dr. Eng. Marcos Daniel Villagra Riquelme
*   **Course:** Blockchain
*   **Author:** Yun Gomez Ishii

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Frontend Configuration](#frontend-configuration)
- [Running the Application](#running-the-application)
- [Features](#features)

## Introduction

This project demonstrates a basic NFT marketplace where users can interact with a smart contract to view and buy digital assets (NFTs).

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (LTS version recommended)
- npm or yarn (npm is included with Node.js)
- Git
- A code editor (like VS Code)
- A browser with a Web3 wallet extension like MetaMask configured with access to an EVM-compatible network. This can be a public testnet (e.g., Sepolia, Goerli), a local development network (like Hardhat Network), or other test networks you might be using.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies for the smart contract:**

    Navigate to the root directory of the project and install Hardhat and other necessary packages.

    ```bash
    npm install # or yarn install
    ```
    *(Assuming Hardhat setup at the root. Adjust if your contract is in a subdirectory.)*

3.  **Install dependencies for the frontend:**

    Navigate to the `web_app` directory and install its dependencies.

    ```bash
    cd web_app
    npm install # or yarn install
    cd .. # Go back to the project root
    ```

## Smart Contract Deployment

1.  **Configure the Hardhat environment:**

    Ensure the `hardhat.config.js` file is set up correctly with the network you want to deploy to (e.g., a testnet or local network) and the wallet's private key or mnemonic (use environment variables for security!).
    The project uses a `.env.example` file to show the required environment variables.
    **Create a `.env` file** by copying `.env.example` and filling in the actual values for sensitive information like private keys and API keys.
    ```bash
    cp .env.example .env
    # Then edit .env
    ```
    Make sure to install the `dotenv` package if the Hardhat configuration uses it (`npm install dotenv --save-dev`).

2.  **Compile the smart contract:**

    ```bash
    npx hardhat compile
    ```
    This command should compile the `Marketplace.sol` contract and generate the ABI and bytecode.

3.  **Deploy the contract:**

    Execute the deployment script using the Hardhat `run` command.

    Use the Hardhat `run` command and specify the target network using the `--network` flag. This will deploy the contract to the network configured in the `hardhat.config.js` file under the specified network name.

    ```bash
    npx hardhat run scripts/deploy.js --network <your_configured_network_name>
    ```
    *(Replace `scripts/deploy.js` with the actual path to the deployment script and `<your_configured_network_name>` with the name of the network configured in the `hardhat.config.js` file, e.g., `sepolia`, `goerli`, or `localhost`).*

    Upon successful deployment, Hardhat will output the contract address. **Copy this address.**

4.  **Mint Initial Batch:**

    The deployment script (`scripts/deploy.js`) includes a call to the `mintInitialBatch` function. As the contract owner, running the deployment script will automatically mint the initial 10 NFTs.

## Frontend Configuration

1.  **Update Contract Address and ABI:**

    Navigate to `web_app/src/contracts/Marketplace.json`. This file should contain the ABI (Application Binary Interface) of the deployed contract. If it doesn't exist or is outdated after deployment, you might need to manually update it or configure the Hardhat deployment process to automatically save the ABI here.

    The deployment script (`scripts/deploy.js`) is configured to automatically save the deployed contract's address and ABI to `web_app/src/contracts/Marketplace.json`.
    Therefore, after successfully deploying the contract using the script, this file should be automatically updated.

    You can verify the contents of `web_app/src/contracts/Marketplace.json` to ensure the correct contract `address` and `abi` are present after deployment.

## Running the Application

1.  **Start the frontend development server:**

    Navigate to the `web_app` directory and run:

    ```bash
    npm run dev # or yarn dev
    ```

2.  Open the browser and go to the address indicated by the development server (usually `http://localhost:5173` or similar).

3.  Connect the MetaMask wallet to the same network the contract was deployed on.

## Features

-   **Connect Wallet:** Connect your Ethereum wallet (MetaMask) to interact with the marketplace.
-   **View NFTs:** See the NFTs listed in the marketplace.
-   **Buy NFTs:** Purchase listed NFTs using connected wallet.
-   **Refresh Items:** Manually refresh the list of NFTs.
-   **Dark/Light Mode:** Toggle between dark and light visual themes.

---

*This README provides instructions based on common practices. The specific project structure or deployment method might require slight adjustments.* 