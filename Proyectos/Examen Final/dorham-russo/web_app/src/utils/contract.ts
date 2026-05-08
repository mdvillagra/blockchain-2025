import { ethers } from 'ethers';

// Contract ABIs
const COLLATERAL_TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const LOAN_TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const LENDING_PROTOCOL_ABI = [
    "function collateralToken() view returns (address)",
    "function loanToken() view returns (address)",
    "function INTEREST_RATE() view returns (uint256)",
    "function COLLATERAL_RATIO() view returns (uint256)",
    "function positions(address) view returns (uint256 collateral, uint256 debt, uint256 lastUpdated)",
    "function depositCollateral(uint256 amount)",
    "function borrow(uint256 amount)",
    "function repay()",
    "function withdrawCollateral()",
    "function getUserPosition(address user) view returns (uint256 collateral, uint256 debt, uint256 interest)",
    "event Deposited(address indexed user, uint256 amount)",
    "event Borrowed(address indexed user, uint256 amount)",
    "event Repaid(address indexed user, uint256 amount)",
    "event Withdrawn(address indexed user, uint256 amount)"
];

// Contract addresses from environment variables
const CONTRACT_ADDRESSES = {
    COLLATERAL_TOKEN: import.meta.env.VITE_COLLATERAL_CONTRACT || "",
    LOAN_TOKEN: import.meta.env.VITE_LOAN_TOKEN_CONTRACT || "",
    LENDING_PROTOCOL: import.meta.env.VITE_LENDING_PROTOCOL_CONTRACT || ""
};

// Validate that all required environment variables are set
const validateEnvironment = () => {
    const requiredVars = [
        'VITE_COLLATERAL_CONTRACT',
        'VITE_LOAN_TOKEN_CONTRACT',
        'VITE_LENDING_PROTOCOL_CONTRACT'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missingVars.length > 0) {
        console.warn('Missing environment variables:', missingVars);
        console.warn('Please set up your .env file with the required contract addresses.');
    }
};

// Call validation on module load
validateEnvironment();

// Export current contract addresses for debugging
export const getContractAddresses = () => {
    return {
        ...CONTRACT_ADDRESSES,
        networkName: import.meta.env.VITE_NETWORK_NAME || 'unknown',
        chainId: import.meta.env.VITE_CHAIN_ID || 'unknown'
    };
};

// Check if contracts are properly configured
export const areContractsConfigured = () => {
    return CONTRACT_ADDRESSES.COLLATERAL_TOKEN &&
        CONTRACT_ADDRESSES.LOAN_TOKEN &&
        CONTRACT_ADDRESSES.LENDING_PROTOCOL;
};

// Types
export interface UserPosition {
    collateral: string;
    debt: string;
    interest: string;
}

export interface TokenInfo {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    balance: string;
}

export interface ProtocolInfo {
    collateralTokenAddress: string;
    loanTokenAddress: string;
    interestRate: number;
    collateralRatio: number;
    protocolLiquidity: string;
}

// Contract instances
let collateralTokenContract: ethers.Contract | null = null;
let loanTokenContract: ethers.Contract | null = null;
let lendingProtocolContract: ethers.Contract | null = null;
let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;

// Initialize contracts
export const initializeContracts = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    console.log('Initializing contracts with addresses:', CONTRACT_ADDRESSES);

    collateralTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.COLLATERAL_TOKEN,
        COLLATERAL_TOKEN_ABI,
        signer
    );

    loanTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.LOAN_TOKEN,
        LOAN_TOKEN_ABI,
        signer
    );

    lendingProtocolContract = new ethers.Contract(
        CONTRACT_ADDRESSES.LENDING_PROTOCOL,
        LENDING_PROTOCOL_ABI,
        signer
    );

    // Test if contracts are accessible
    try {
        const collateralName = await collateralTokenContract.name();
        const loanName = await loanTokenContract.name();
        const protocolCollateral = await lendingProtocolContract.collateralToken();

        console.log('Contract initialization successful:');
        console.log('- Collateral token name:', collateralName);
        console.log('- Loan token name:', loanName);
        console.log('- Protocol collateral address:', protocolCollateral);
    } catch (error) {
        console.error('Contract initialization test failed:', error);
        throw new Error('Failed to initialize contracts. Please check if contracts are deployed correctly.');
    }

    return {
        collateralTokenContract,
        loanTokenContract,
        lendingProtocolContract,
        provider,
        signer
    };
};

// Get contract instances
export const getContracts = () => {
    if (!collateralTokenContract || !loanTokenContract || !lendingProtocolContract) {
        throw new Error('Contracts not initialized. Call initializeContracts() first.');
    }
    return {
        collateralTokenContract,
        loanTokenContract,
        lendingProtocolContract,
        provider,
        signer
    };
};

// Token functions
export const getTokenInfo = async (tokenType: 'collateral' | 'loan'): Promise<TokenInfo> => {
    const { signer } = getContracts();
    if (!signer) throw new Error('Signer not available');
    const contract = tokenType === 'collateral' ? collateralTokenContract! : loanTokenContract!;
    const address = await signer.getAddress();

    const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(address)
    ]);

    return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        balance: ethers.formatEther(balance)
    };
};

export const approveToken = async (tokenType: 'collateral' | 'loan', amount: string) => {
    console.log('approveToken called with amount:', amount);
    console.log('Amount type:', typeof amount);
    console.log('Amount length:', amount.length);

    const contract = tokenType === 'collateral' ? collateralTokenContract! : loanTokenContract!;

    // Check if amount is a valid number
    const amountFloat = parseFloat(amount);
    console.log('Amount as float:', amountFloat);

    if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error('Invalid amount provided');
    }

    const amountWei = ethers.parseEther(amount);
    console.log('Amount in Wei:', amountWei.toString());
    console.log('Expected Wei for 0.00001:', ethers.parseEther('0.00001').toString());
    const { signer } = getContracts();
    if (!signer) throw new Error('Signer not available');
    const userAddress = await signer.getAddress();

    try {
        // Check user's balance first
        const balance = await contract.balanceOf(userAddress);
        console.log('User balance:', ethers.formatEther(balance));

        if (balance < amountWei) {
            throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} tokens but trying to approve ${amount}`);
        }

        // Check current allowance
        const currentAllowance = await contract.allowance(userAddress, CONTRACT_ADDRESSES.LENDING_PROTOCOL);
        console.log('Current allowance:', ethers.formatEther(currentAllowance));

        // Estimate gas first
        const gasEstimate = await contract.approve.estimateGas(CONTRACT_ADDRESSES.LENDING_PROTOCOL, amountWei);
        console.log('Gas estimate:', gasEstimate.toString());

        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate * 120n / 100n;

        // Try without specifying gas parameters first
        const tx = await contract.approve(CONTRACT_ADDRESSES.LENDING_PROTOCOL, amountWei);

        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        return tx;
    } catch (error) {
        console.error('Approve transaction failed:', error);
        throw error;
    }
};

export const getTokenAllowance = async (tokenType: 'collateral' | 'loan'): Promise<string> => {
    const { signer } = getContracts();
    if (!signer) throw new Error('Signer not available');
    const contract = tokenType === 'collateral' ? collateralTokenContract! : loanTokenContract!;
    const address = await signer.getAddress();

    const allowance = await contract.allowance(address, CONTRACT_ADDRESSES.LENDING_PROTOCOL);
    return ethers.formatEther(allowance);
};

// Protocol functions
export const getProtocolInfo = async (): Promise<ProtocolInfo> => {
    const { loanTokenContract } = getContracts();

    const [collateralTokenAddress, loanTokenAddress, interestRate, collateralRatio, protocolLiquidity] = await Promise.all([
        lendingProtocolContract!.collateralToken(),
        lendingProtocolContract!.loanToken(),
        lendingProtocolContract!.INTEREST_RATE(),
        lendingProtocolContract!.COLLATERAL_RATIO(),
        loanTokenContract.balanceOf(CONTRACT_ADDRESSES.LENDING_PROTOCOL)
    ]);

    return {
        collateralTokenAddress,
        loanTokenAddress,
        interestRate: Number(interestRate),
        collateralRatio: Number(collateralRatio),
        protocolLiquidity: ethers.formatEther(protocolLiquidity)
    };
};

export const getUserPosition = async (): Promise<UserPosition> => {
    const { signer } = getContracts();
    if (!signer) throw new Error('Signer not available');
    const address = await signer.getAddress();

    const [collateral, debt, interest] = await lendingProtocolContract!.getUserPosition(address);

    return {
        collateral: ethers.formatEther(collateral),
        debt: ethers.formatEther(debt),
        interest: ethers.formatEther(interest)
    };
};

// Lending functions
export const depositCollateral = async (amount: string) => {
    const amountWei = ethers.parseEther(amount);

    try {
        // Estimate gas first
        const gasEstimate = await lendingProtocolContract!.depositCollateral.estimateGas(amountWei);
        console.log('Deposit gas estimate:', gasEstimate.toString());

        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate * 120n / 100n;

        const tx = await lendingProtocolContract!.depositCollateral(amountWei, {
            gasLimit: gasLimit
        });

        console.log('Deposit transaction sent:', tx.hash);
        await tx.wait();
        return tx;
    } catch (error) {
        console.error('Deposit transaction failed:', error);
        throw error;
    }
};

export const borrow = async (amount: string) => {
    const amountWei = ethers.parseEther(amount);

    const tx = await lendingProtocolContract!.borrow(amountWei);
    await tx.wait();
    return tx;
};

export const repay = async () => {
    const tx = await lendingProtocolContract!.repay();
    await tx.wait();
    return tx;
};

export const withdrawCollateral = async () => {
    const tx = await lendingProtocolContract!.withdrawCollateral();
    await tx.wait();
    return tx;
};

// Utility functions
export const formatEther = (amount: bigint | string): string => {
    return ethers.formatEther(amount);
};

export const parseEther = (amount: string): bigint => {
    return ethers.parseEther(amount);
};

export const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Calculate maximum borrowable amount based on collateral
export const calculateMaxBorrow = (collateralAmount: string, collateralRatio: number): string => {
    const collateral = parseFloat(collateralAmount);
    const maxBorrow = collateral * 100 / collateralRatio;
    return maxBorrow.toFixed(6);
};

// Calculate required collateral for a borrow amount
export const calculateRequiredCollateral = (borrowAmount: string, collateralRatio: number): string => {
    const borrow = parseFloat(borrowAmount);
    const requiredCollateral = borrow * collateralRatio / 100;
    return requiredCollateral.toFixed(6);
};

// Check if wallet is connected
export const isWalletConnected = async (): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') return false;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        return accounts.length > 0;
    } catch (error) {
        return false;
    }
};

// Get connected account
export const getConnectedAccount = async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') return null;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
        return null;
    }
};

// Connect wallet
export const connectWallet = async (): Promise<string> => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);

    if (accounts.length === 0) {
        throw new Error('No accounts found');
    }

    return accounts[0];
};

// Listen for account changes
export const onAccountsChanged = (callback: (accounts: string[]) => void) => {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('accountsChanged', callback);
};

// Listen for chain changes
export const onChainChanged = (callback: (chainId: string) => void) => {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('chainChanged', callback);
};

// Get network info
export const getNetworkInfo = async () => {
    if (typeof window.ethereum === 'undefined') return null;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    return {
        chainId: network.chainId,
        name: network.name
    };
}; 