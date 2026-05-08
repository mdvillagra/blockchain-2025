# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```


# Smart Contract Tests

This directory contains comprehensive tests for the DeFi lending protocol smart contracts.

## Test Structure

### Files Overview

- **`00_deploy.ts`** - Deployment script that sets up contracts for testing
- **`01_CollateralToken.test.ts`** - Tests for the CollateralToken ERC20 contract
- **`02_LoanToken.test.ts`** - Tests for the LoanToken ERC20 contract  
- **`03_LendingProtocol.test.ts`** - Tests for the main LendingProtocol contract
- **`04_Security.test.ts`** - Security-focused tests and edge cases
- **`helpers.ts`** - Helper functions for testing

### Test Categories

#### 1. CollateralToken & LoanToken Tests
- **Deployment**: Verifies correct initialization, token supply, name, symbol, decimals
- **Transfers**: Tests token transfers between accounts, insufficient balance handling
- **Allowances**: Tests approve/transferFrom functionality
- **Edge Cases**: Zero transfers, self-transfers

#### 2. LendingProtocol Tests
- **Deployment**: Verifies correct token addresses, constants, initial liquidity
- **Deposit Collateral**: Tests collateral deposits, event emissions, error handling
- **Borrow**: Tests borrowing with sufficient collateral, collateral ratio enforcement
- **Repay**: Tests debt repayment with interest calculation
- **Withdraw Collateral**: Tests collateral withdrawal when debt-free
- **Interest Calculation**: Tests weekly interest accrual (5% annual rate)
- **Integration**: Complete lending cycles, multiple users

#### 3. Security Tests
- **Reentrancy Protection**: Ensures no reentrancy vulnerabilities
- **Access Control**: Verifies proper access restrictions
- **Integer Overflow/Underflow**: Tests with large numbers and zero amounts
- **Precision and Rounding**: Tests interest calculation with small amounts
- **Gas Optimization**: Ensures reasonable gas consumption
- **State Consistency**: Verifies state remains consistent after operations
- **Boundary Conditions**: Tests at collateral ratio limits
- **Event Emission**: Verifies correct event parameters

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx hardhat test test/03_LendingProtocol.test.ts
```

### Run Tests with Verbose Output
```bash
npx hardhat test --verbose
```

## Test Configuration

The tests use Hardhat's built-in testing framework with:
- **Network**: Hardhat Network (local development)
- **Testing Framework**: Mocha + Chai
- **TypeScript**: Full type safety with generated types
- **Gas Tracking**: Automatic gas usage monitoring

## Key Test Scenarios

### Basic Functionality
1. **Token Deployment**: Verify correct token initialization
2. **Collateral Deposit**: Users can deposit collateral tokens
3. **Borrowing**: Users can borrow against deposited collateral
4. **Interest Accrual**: Interest accumulates weekly (5% annual rate)
5. **Debt Repayment**: Users can repay debt with accumulated interest
6. **Collateral Withdrawal**: Users can withdraw collateral when debt-free

### Security Scenarios
1. **Insufficient Collateral**: Borrowing fails when collateral ratio is insufficient
2. **Insufficient Liquidity**: Borrowing fails when protocol lacks liquidity
3. **Outstanding Debt**: Withdrawal fails when user has outstanding debt
4. **No Approval**: Operations fail without proper token approvals

### Edge Cases
1. **Zero Amounts**: Handling of zero deposits/borrows
2. **Maximum Ratios**: Testing at exact collateral ratio limits
3. **Small Amounts**: Interest calculation with very small amounts
4. **Multiple Users**: Concurrent operations by different users

## Constants Used in Tests

- **Interest Rate**: 5% annual (calculated weekly)
- **Collateral Ratio**: 150% (1.5x)
- **Initial Token Supply**: 1,000,000 tokens per token type
- **Initial Protocol Liquidity**: 100,000 loan tokens
- **Test User Allocation**: 10,000 collateral tokens per test user

## Coverage Goals

The test suite aims for:
- **Function Coverage**: 100% of all public/external functions
- **Branch Coverage**: 100% of all conditional branches
- **Line Coverage**: >95% of all code lines
- **Edge Case Coverage**: All boundary conditions and error scenarios

## Continuous Integration

These tests are designed to run in CI/CD pipelines and provide:
- Fast execution (< 30 seconds for full suite)
- Deterministic results
- Clear error messages
- Coverage reporting
- Gas usage tracking 