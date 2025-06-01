# NFT Marketplace

A decentralized NFT marketplace built with Solidity, Hardhat, and React. This project allows users to mint, list, and trade NFTs on the blockchain.

## Features

- 🔗 Connect your MetaMask wallet
- 🎨 Mint new NFTs with custom URIs
- 💰 List NFTs for sale with custom prices
- 🛍️ Buy NFTs from other users
- 🔍 Check NFT listings and details
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.28
- **Development Environment**: Hardhat
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js
- **Deployment**: Hardhat Ignition

## Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sol_admin
```

2. Install dependencies:
```bash
# Install project dependencies
npm install

# Install web app dependencies
cd web_app
npm install
```

3. Create a `.env` file in the root directory:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

4. Create a `.env` file in the web_app directory:
```env
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

## Development

1. Start the local Hardhat network:
```bash
npx hardhat node
```

2. Deploy the contract:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

3. Start the development server:
```bash
cd web_app
npm run dev
```
contract: 0x9A57eD6c0436dbFdeb5646f702158f5Fc078B0D8