# DeFi Lending Protocol

A modular, secure decentralized lending protocol built with Solidity (contracts) and React (frontend), enabling users to deposit cUSD collateral and borrow dDAI at a fixed 150% collateralization ratio.

---

## 📚 Table of Contents

* [📖 Overview](#📖-overview)
* [🚀 Quick Start](#🚀-quick-start)
* [🗂 Project Structure](#🗂-project-structure)
* [🔧 Configuration](#🔧-configuration)
* [🛠 Development Commands](#🛠-development-commands)
* [📜 Features](#📜-features)
* [📊 Testing & Coverage](#📊-testing--coverage)
* [🔒 Security](#🔒-security)
* [🤝 Contributing](#🤝-contributing)
* [📄 License](#📄-license)

---

## 📖 Overview

This protocol offers:

* **Collateral Deposits**: Users lock cUSD (ERC20) tokens.
* **Borrowing**: Up to 66.67% of collateral value in dDAI.
* **Interest**: 5% weekly (basis points) on borrowed amount.
* **Repayment**: Full loan + accrued interest.
* **Withdrawal**: Recover collateral once debt is cleared.

The React frontend provides a polished UI, real‑time data, and MetaMask integration.

---

## 🚀 Quick Start

1. **Clone & Install**

   ```bash
   git clone <your-repo-url>
   cd defi-lending-app
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env:
   # PRIVATE_KEY=<YOUR_SEPOLIA_PRIVATE_KEY>
   # SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
   # ETHERSCAN_API_KEY=<YOUR_ETHERSCAN_KEY>  (optional)
   ```

3. **Compile & Test**

   ```bash
   npm run compile
   npm test
   npm run coverage
   ```

4. **Deploy to Sepolia**

   ```bash
   npm run deploy:sepolia
   # deployment-addresses.json is auto-generated
   ```

5. **Fund Protocol (if needed)**

   ```bash
   npm run fund:sepolia
   ```

6. **Start Frontend**

   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to interact.

---

## 🗂 Project Structure

```plaintext
contracts/            # Solidity contracts
  CollateralAsset.sol
  BorrowableAsset.sol
  DeFiLending.sol
  TimeLock.sol

scripts/              # Deployment & utility scripts
  deploy-protocol.ts   # Deploys contracts & writes JSON
  fund-protocol.ts     # Mints & funds protocol
  account-info.ts      # Logs account info (nonce, gas, balance)

src/                  # React frontend
  constants/           # Addresses & ABI definitions
  hooks/               # useBlockchain Web3 hook
  components/          # Modular UI components
  App.jsx              # Application root

test/                 # Hardhat tests (100% coverage)
  DeFiLending.test.ts
  TimeLock.test.ts

deployment-addresses.json  # Auto-generated after deploy
hardhat.config.ts          # Hardhat configuration
vite.config.js             # Vite configuration
package.json               # Scripts & dependencies
tsconfig.json              # TypeScript settings
README.md                  # Project documentation
```

---

## 🔧 Configuration

* **Hardhat**: `hardhat.config.ts` configures Solidity compiler, networks (Sepolia, localhost, Ephemery), and Etherscan.
* **Vite/React**: `vite.config.js` sets root, build output, dev server port, and alias `@` → `src`.
* **Environment**: `.env` holds `PRIVATE_KEY`, `RPC` endpoints, optional `ETHERSCAN_API_KEY`.

---

## 🛠 Development Commands

```bash
npm run compile         # Compile contracts
npm test                # Run tests
npm run coverage        # Generate coverage report
npm run deploy:sepolia  # Deploy to Sepolia + auto-generate addresses
npm run fund:sepolia    # Fund protocol with test tokens
npm run check:nonce     # Show account nonce, balance, gas
npm run dev             # Start React frontend
npm run build           # Bundle for production
npm run preview         # Preview production build
```

---

## 📜 Features

### Smart Contracts

* **ERC20 Tokens**: `CollateralAsset` (cUSD), `BorrowableAsset` (dDAI) with owner-mint.
* **DeFiLending**: Deposit, borrow, repay, withdraw, interest calc, owner rescue.
* **TimeLock**: Ethereum timelock with release timestamp.
* **Security**: `Ownable(msg.sender)`, `ReentrancyGuard`, input validation.

### Frontend

* **Modular React**: Hooks + components.
* **Web3**: `useBlockchain` hook for provider, signer, contract calls.
* **UI**: Glassmorphism panels, responsive grids, real-time data.
* **Minting**: Test token mint function.
* **Error Handling**: Network checks, gas errors, user alerts.

---

## 📊 Testing & Coverage

* **Hardhat & Chai**: Extensive unit tests.
* **Coverage**: 100% statements & functions, >85% branches.
* **Fixtures**: `loadFixture` for clean test states.
* **Edge Cases**: Zero amounts, over-borrow, unauthorized usage.

---

## 🔒 Security

* **ReentrancyGuard**: Protects against re-entrancy.
* **Ownable**: Restricts sensitive functions.
* **SafeMath**: Solidity 0.8 built-in overflow checks.
* **Event Logging**: Comprehensive audit trail.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes & run tests (`npm test`)
4. Open a Pull Request

---

## 📄 License

MIT © YEnzo Vidallet
