# DeFi Lending Protocol DApp

This is a decentralized application (DApp) for a DeFi lending protocol, built as a college project.  
It allows users to deposit collateral, borrow synthetic assets, repay loans, and withdraw collateral, all from a user-friendly web interface.

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

This project demonstrates a basic DeFi lending protocol where users can interact with smart contracts to deposit collateral (cUSD), borrow synthetic assets (dDAI), repay loans, and withdraw their collateral.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (LTS version recommended)
- npm or yarn (npm is included with Node.js)
- Git
- A code editor (like VS Code)
- A browser with a Web3 wallet extension like MetaMask configured with access to an EVM-compatible network (public testnet, local Hardhat, or other).

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ishiiyvn/blockchain-2025.git
    cd blockchain-2025/proyectos/Examen\ Final/Yun\ Gomez/
    ```

2.  **Install dependencies for the smart contract:**

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
    Make sure to install the `dotenv` package (`npm install dotenv --save-dev`).

2.  **Compile the smart contracts:**

    ```bash
    npx hardhat compile
    ```

3.  **Run the smart contract tests:**

    To run the smart contract tests using Hardhat:

    ```bash
    npx hardhat test
    ```
    This will execute all tests in the `test/` directory and display the results in the console.

4.  **Generate a test coverage report:**

    To generate a test coverage report for your smart contracts:

    ```bash
    npm run coverage
    ```
    This will output a summary in the console and generate a detailed coverage report in the `coverage/` directory.

5.  **Deploy the contracts:**

    Use the provided deployment script and specify the target network using the `--network` flag. This will deploy the contracts to the network configured in the `hardhat.config.js` file under the specified network name.

    ```bash
    npx hardhat run scripts/deploy.js --network ephemery
    ```
    *(Replace `ephemery` with the name of the network configured in your `hardhat.config.js` file, e.g., `sepolia`, `goerli`, or `localhost`.)*

    After deployment, note the addresses for:
    - LendingProtocol
    - CollateralToken (cUSD)
    - LoanToken (dDAI)

4.  **Update Frontend Environment:**

    Set the deployed contract addresses in the frontend's `.env` file (see `web_app/.env.example`).

## Frontend Configuration

1.  **Update Contract Addresses and ABIs:**

    - The deployment script (`scripts/deploy.js`) automatically saves the ABI files for LendingProtocol, CollateralToken, and LoanToken to `web_app/src/contracts/` after deployment.
    - Ensure the addresses in your frontend `.env` match the deployed contracts.

    **⚠️ Warning:** This process will overwrite any existing ABI files in `web_app/src/contracts/` and will also update (overwrite) the contract addresses in `web_app/.env`. If you have made manual changes to these files, they will be lost after each deployment.

2.  **(Optional) ABI Automation:**

    You can automate ABI copying in your deployment script or do it manually after each deployment.

## Running the Application

1.  **Start the frontend development server:**

    Navigate to the `web_app` directory and run:

    ```bash
    cd web_app
    npm run dev
    ```

2.  Open your browser to the address shown (usually `http://localhost:5173`).

3.  Connect MetaMask to the same network as your deployed contracts.

## Features

- **Connect Wallet:** Connect your Ethereum wallet (MetaMask) to interact with the protocol.
- **Deposit Collateral:** Deposit cUSD as collateral.
- **Borrow dDAI:** Borrow synthetic dDAI against your collateral.
- **Repay Loan:** Repay your outstanding dDAI debt (including accrued interest).
- **Withdraw Collateral:** Withdraw your cUSD collateral (if you have no outstanding debt).
- **View Protocol Stats:** See total collateral, total loans, and available liquidity.
- **Live Portfolio:** View your balances, debt, accrued interest, and collateralization ratio.

---

*This README provides instructions based on common practices. Adjust as needed for your specific project structure or deployment method.* 