# Blockchain 2025 - FP-UNA

Course repository for the Blockchain course at Facultad Politecnica, Universidad Nacional de Asuncion.

This repository combines course scaffolding, reference code, and student submissions for blockchain engineering assignments. It should be read primarily as teaching infrastructure rather than as a single authored production application.

## Maintainer role

Marcos Villagra designed and maintained the course repository structure, assignment workflow, and base blockchain/DApp examples. Student projects are collected under `Proyectos/` and remain the work of the students listed in each project directory.

## Repository map

- `contracts/`: base Solidity contracts used in course examples, including an ERC-721 marketplace contract.
- `web_app/`: base React/Vite frontend for interacting with the marketplace through MetaMask and `ethers.js`.
- `Proyectos/Parcial 1/`: first partial-exam submissions.
- `Proyectos/Parcial 2/`: second partial-exam submissions.
- `Proyectos/Examen Final/`: final project submissions.

## Stack

- Solidity and Hardhat for smart contract development.
- OpenZeppelin contracts for ERC-721 primitives.
- React, Vite, and `ethers.js` for frontend DApp interaction.
- MetaMask and Ethereum test networks for wallet-based workflows.

## Running the base example

Install dependencies from the repository root:

```bash
npm install
```

Compile the contracts:

```bash
npx hardhat compile
```

Run the frontend:

```bash
cd web_app
npm install
npm run dev
```

Individual student projects may have their own setup instructions in their subdirectories.

## Note for reviewers

The value of this repository is the course design and mentoring signal: assignments, scaffolding, review workflow, and many student project submissions in Solidity/Hardhat/React. Do not interpret every file under `Proyectos/` as code personally authored by the maintainer.
