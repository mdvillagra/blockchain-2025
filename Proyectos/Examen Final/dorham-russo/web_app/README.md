# DeFi Lending Protocol Frontend

A modern React-based frontend for testing and interacting with the DeFi lending protocol smart contracts.

## Features

### Core Functionality
- **Wallet Connection**: Connect MetaMask or other Web3 wallets
- **Position Overview**: View your current lending position, collateral, debt, and interest
- **Token Balances**: Display balances for both collateral and loan tokens
- **Health Factor**: Visual indicator of position health and liquidation risk
- **Protocol Information**: View interest rates, collateral ratios, and protocol liquidity

### Lending Operations
- **Deposit Collateral**: Deposit collateral tokens to enable borrowing
- **Borrow**: Borrow loan tokens against deposited collateral
- **Repay Debt**: Repay outstanding debt including accrued interest
- **Withdraw Collateral**: Withdraw collateral when debt-free

### User Experience
- **Real-time Updates**: Automatic data refresh after transactions
- **Modal Interfaces**: Clean, intuitive modals for all operations
- **Error Handling**: Comprehensive error messages and validation
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Visual feedback during transactions

## Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Deployed smart contracts (update contract addresses in `src/utils/contract.ts`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your deployed contract addresses
   nano .env
   ```

3. Update contract addresses in `.env`:
   ```env
   VITE_COLLATERAL_CONTRACT=0x...    # Your deployed CollateralToken address
   VITE_LOAN_TOKEN_CONTRACT=0x...    # Your deployed LoanToken address
   VITE_LENDING_PROTOCOL_CONTRACT=0x...    # Your deployed LendingProtocol address
   VITE_NETWORK_NAME=localhost            # Network name (optional)
   VITE_CHAIN_ID=31337                    # Chain ID (optional)
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

### Connecting Your Wallet
1. Click "Connect Wallet" in the header
2. Approve the connection in MetaMask
3. Ensure you're connected to the correct network (Hardhat, local, or testnet)

### Depositing Collateral
1. Click "Deposit Collateral" button
2. Enter the amount you want to deposit
3. Approve the token spending (first time only)
4. Confirm the deposit transaction

### Borrowing
1. Ensure you have sufficient collateral deposited
2. Click "Borrow" button
3. Enter the amount you want to borrow
4. Confirm the borrow transaction

### Repaying Debt
1. Click "Repay Debt" button
2. Review the debt summary (principal + interest)
3. Approve the token spending (if needed)
4. Confirm the repayment transaction

### Withdrawing Collateral
1. Ensure you have no outstanding debt
2. Click "Withdraw Collateral" button
3. Review the withdrawal amount
4. Confirm the withdrawal transaction

## Project Structure

```
src/
├── components/
│   ├── LendingDashboard.tsx    # Main dashboard component
│   ├── DepositModal.tsx        # Deposit collateral modal
│   ├── BorrowModal.tsx         # Borrow tokens modal
│   ├── RepayModal.tsx          # Repay debt modal
│   ├── WithdrawModal.tsx       # Withdraw collateral modal
│   └── WalletProviders.tsx     # Wallet connection provider
├── utils/
│   ├── contract.ts             # Contract interaction utilities
│   └── index.ts                # Utility exports
├── types/                      # TypeScript type definitions
├── hooks/                      # Custom React hooks
└── App.tsx                     # Main application component
```

## Configuration

### Environment Variables
The application uses environment variables for configuration. Create a `.env` file in the root directory:

```env
# Required: Contract Addresses
VITE_COLLATERAL_CONTRACT=0x...    # Your deployed CollateralToken address
VITE_LOAN_TOKEN_CONTRACT=0x...    # Your deployed LoanToken address
VITE_LENDING_PROTOCOL_CONTRACT=0x...    # Your deployed LendingProtocol address

# Optional: Network Configuration
VITE_NETWORK_NAME=localhost            # Network name for display
VITE_CHAIN_ID=31337                    # Chain ID for validation
```

### Contract Addresses
The contract addresses are now loaded from environment variables. You can also access them programmatically:

```typescript
import { getContractAddresses } from './utils/contract';

const addresses = getContractAddresses();
console.log('Current contract addresses:', addresses);
```

### Network Configuration
The app automatically detects the connected network. Make sure your contracts are deployed on the network you're connecting to.

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features
1. Create new components in `src/components/`
2. Add contract functions in `src/utils/contract.ts`
3. Update types in `src/types/` if needed
4. Integrate with the main dashboard

## Testing

The frontend is designed to work with the comprehensive test suite in the parent directory. To test the full system:

1. Deploy contracts using Hardhat
2. Update contract addresses in the frontend
3. Run the frontend and interact with the deployed contracts
4. Verify all functionality works as expected

## Troubleshooting

### Common Issues

**"MetaMask is not installed"**
- Install MetaMask browser extension
- Ensure it's enabled for the current site

**"Contracts not initialized"**
- Check that contract addresses are correct
- Ensure you're connected to the right network
- Verify contracts are deployed and accessible

**"Insufficient balance"**
- Check your token balances
- Ensure you have enough tokens for the operation

**"Transaction failed"**
- Check gas fees and network congestion
- Verify you have sufficient ETH for gas
- Review transaction parameters

### Debug Mode
Enable browser developer tools to see detailed error messages and transaction logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the DeFi lending protocol demonstration.
