import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Contract ABIs (simplified for essential functions)
const LENDING_PROTOCOL_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function borrow(uint256 amount) external",
  "function repay() external",
  "function withdrawCollateral() external",
  "function getUserData(address user) external view returns (uint256, uint256, uint256, uint256)",
  "function getProtocolStats() external view returns (uint256, uint256, uint256)",
  "function collateralToken() external view returns (address)",
  "function loanToken() external view returns (address)"
];

const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
];

// Add at the top, after imports
const EXPECTED_CHAIN_ID = '0x259C743'; // 39438147 in hex. Ephemery test network. Change as needed.
const ETHERSCAN_PREFIX = 'https://otter.bordel.wtf/tx/'; // Change for testnet if needed

function App() {
  // State variables
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [contracts, setContracts] = useState({});
  const [userData, setUserData] = useState({
    collateralBalance: '0',
    loanBalance: '0',
    accruedInterest: '0',
    totalDebt: '0'
  });
  const [tokenBalances, setTokenBalances] = useState({
    collateral: '0',
    loan: '0'
  });
  const [protocolStats, setProtocolStats] = useState({
    totalCollateral: '0',
    totalLoans: '0',
    liquidity: '0'
  });
  const [loading, setLoading] = useState({ deposit: false, borrow: false, repay: false, withdraw: false });
  const [amounts, setAmounts] = useState({
    deposit: '',
    borrow: ''
  });
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [txInfo, setTxInfo] = useState({ hash: '', link: '' });

  // Contract addresses from environment variables
  const LENDING_PROTOCOL_ADDRESS = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
  const COLLATERAL_TOKEN_ADDRESS = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
  const LOAN_TOKEN_ADDRESS = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;

  console.log("LENDING_PROTOCOL_ADDRESS:", LENDING_PROTOCOL_ADDRESS);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is required!');
      return;
    }

    try {
      setLoading(true);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const userAccount = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAccount);

      // Initialize contracts
      const lendingProtocol = new ethers.Contract(
        LENDING_PROTOCOL_ADDRESS,
        LENDING_PROTOCOL_ABI,
        web3Signer
      );

      const collateralToken = new ethers.Contract(
        COLLATERAL_TOKEN_ADDRESS,
        ERC20_ABI,
        web3Signer
      );

      const loanToken = new ethers.Contract(
        LOAN_TOKEN_ADDRESS,
        ERC20_ABI,
        web3Signer
      );

      setContracts({
        lendingProtocol,
        collateralToken,
        loanToken
      });

      console.log('Connected to:', userAccount);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Load user data
  const loadUserData = async () => {
    if (!contracts.lendingProtocol || !account) return;

    try {
      // Get user data from protocol
      const data = await contracts.lendingProtocol.getUserData(account);
      setUserData({
        collateralBalance: ethers.formatEther(data[0]),
        loanBalance: ethers.formatEther(data[1]),
        accruedInterest: ethers.formatEther(data[2]),
        totalDebt: ethers.formatEther(data[3])
      });

      // Get token balances
      const [collateralBalance, loanBalance] = await Promise.all([
        contracts.collateralToken.balanceOf(account),
        contracts.loanToken.balanceOf(account)
      ]);

      setTokenBalances({
        collateral: ethers.formatEther(collateralBalance),
        loan: ethers.formatEther(loanBalance)
      });

      // Get protocol stats
      const stats = await contracts.lendingProtocol.getProtocolStats();
      setProtocolStats({
        totalCollateral: ethers.formatEther(stats[0]),
        totalLoans: ethers.formatEther(stats[1]),
        liquidity: ethers.formatEther(stats[2])
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Network check
  useEffect(() => {
    async function checkNetwork() {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chainId from MetaMask:', chainId);
        console.log('Expected chainId:', EXPECTED_CHAIN_ID);
        console.log('Match?', chainId === EXPECTED_CHAIN_ID);
        
        // Make comparison case-insensitive and trim whitespace
        const normalizedCurrent = chainId.toLowerCase().trim();
        const normalizedExpected = EXPECTED_CHAIN_ID.toLowerCase().trim();
        
        setNetworkMismatch(normalizedCurrent !== normalizedExpected);
      }
    }
    checkNetwork();
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  // Deposit collateral
  const deposit = async () => {
    setTxInfo({ hash: '', link: '' });
    if (!amounts.deposit || !contracts.lendingProtocol) return;
    const depositValue = parseFloat(amounts.deposit);
    if (isNaN(depositValue) || depositValue <= 0) {
      alert('Enter a positive deposit amount.');
      return;
    }
    if (depositValue > parseFloat(tokenBalances.collateral)) {
      alert('Insufficient cUSD balance.');
      return;
    }
    try {
      setLoading(l => ({ ...l, deposit: true }));
      const amount = ethers.parseEther(amounts.deposit);
      const allowance = await contracts.collateralToken.allowance(account, LENDING_PROTOCOL_ADDRESS);
      if (allowance < amount) {
        // Approve infinite allowance for cUSD
        const approveTx = await contracts.collateralToken.approve(LENDING_PROTOCOL_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }
      const depositTx = await contracts.lendingProtocol.depositCollateral(amount);
      await depositTx.wait();
      setTxInfo({ hash: depositTx.hash, link: ETHERSCAN_PREFIX + depositTx.hash });
      setAmounts(a => ({ ...a, deposit: '' }));
      await loadUserData();
      alert('Collateral deposited successfully!');
    } catch (error) {
      handleError(error, 'depositing');
    } finally {
      setLoading(l => ({ ...l, deposit: false }));
    }
  };

  // Borrow tokens
  const borrow = async () => {
    setTxInfo({ hash: '', link: '' });
    if (!amounts.borrow || !contracts.lendingProtocol) return;
    const borrowValue = parseFloat(amounts.borrow);
    if (isNaN(borrowValue) || borrowValue <= 0) {
      alert('Enter a positive borrow amount.');
      return;
    }
    if (borrowValue > parseFloat(maxBorrowable())) {
      alert('Amount exceeds your max borrowable.');
      return;
    }
    try {
      setLoading(l => ({ ...l, borrow: true }));
      const amount = ethers.parseEther(amounts.borrow);
      // No approval needed for borrowing dDAI
      const borrowTx = await contracts.lendingProtocol.borrow(amount);
      await borrowTx.wait();
      setTxInfo({ hash: borrowTx.hash, link: ETHERSCAN_PREFIX + borrowTx.hash });
      setAmounts(a => ({ ...a, borrow: '' }));
      await loadUserData();
      alert('Tokens borrowed successfully!');
    } catch (error) {
      handleError(error, 'borrowing');
    } finally {
      setLoading(l => ({ ...l, borrow: false }));
    }
  };

  // Repay loan
  const repay = async () => {
    setTxInfo({ hash: '', link: '' });
    if (!contracts.lendingProtocol || userData.totalDebt === '0') return;
    if (parseFloat(userData.totalDebt) > parseFloat(tokenBalances.loan)) {
      alert('Insufficient dDAI balance to repay.');
      return;
    }
    try {
      setLoading(l => ({ ...l, repay: true }));
      // Approve infinite allowance for dDAI
      await contracts.loanToken.approve(LENDING_PROTOCOL_ADDRESS, ethers.MaxUint256);
      const repayTx = await contracts.lendingProtocol.repay();
      await repayTx.wait();
      setTxInfo({ hash: repayTx.hash, link: ETHERSCAN_PREFIX + repayTx.hash });
      await loadUserData();
      alert('Loan repaid successfully!');
    } catch (error) {
      handleError(error, 'repaying');
    } finally {
      setLoading(l => ({ ...l, repay: false }));
    }
  };

  // Withdraw collateral
  const withdraw = async () => {
    setTxInfo({ hash: '', link: '' });
    if (!contracts.lendingProtocol || userData.collateralBalance === '0') return;
    try {
      setLoading(l => ({ ...l, withdraw: true }));
      const withdrawTx = await contracts.lendingProtocol.withdrawCollateral();
      await withdrawTx.wait();
      setTxInfo({ hash: withdrawTx.hash, link: ETHERSCAN_PREFIX + withdrawTx.hash });
      await loadUserData();
      alert('Collateral withdrawn successfully!');
    } catch (error) {
      handleError(error, 'withdrawing');
    } finally {
      setLoading(l => ({ ...l, withdraw: false }));
    }
  };

  // Calculate maximum borrowable amount (66.67% of collateral)
  const maxBorrowable = () => {
    const collateral = parseFloat(userData.collateralBalance) || 0;
    const currentDebt = parseFloat(userData.totalDebt) || 0;
    return Math.max(0, (collateral * 0.6667) - currentDebt).toFixed(4);
  };

  // Calculate collateralization ratio
  const collateralizationRatio = () => {
    const collateral = parseFloat(userData.collateralBalance) || 0;
    const debt = parseFloat(userData.totalDebt) || 0;
    if (debt === 0) return 'N/A';
    return ((collateral / debt) * 100).toFixed(2) + '%';
  };

  // Error handler
  function handleError(error, action) {
    let message = `Failed to ${action}.`;
    if (error?.data?.message) message += '\n' + error.data.message;
    else if (error?.error?.message) message += '\n' + error.error.message;
    else if (error?.message) message += '\n' + error.message;
    alert(message);
  }

  // Load data when contracts are available
  useEffect(() => {
    if (contracts.lendingProtocol && account) {
      loadUserData();
      
      // Set up polling for data updates
      const interval = setInterval(loadUserData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [contracts.lendingProtocol, account]);

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount('');
          setContracts({});
          setSigner(null);
          setProvider(null);
        } else {
          // Account changed
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        // Reload the page on chain change
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>🏦 DeFi Lending Protocol</h1>
        <p>Collateralized Lending with cUSD and dDAI</p>
        
        {!account ? (
          <button 
            onClick={connectWallet} 
            disabled={loading.connect}
            className="connect-button"
          >
            {loading.connect ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : (
          <div className="account-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          </div>
        )}
      </header>

      {account && (
        <main className="main-content">
          {/* User Portfolio */}
          <section className="portfolio-section">
            <h2>Your Portfolio</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Collateral Deposited</h3>
                <p>{parseFloat(userData.collateralBalance).toFixed(4)} cUSD</p>
              </div>
              <div className="stat-card">
                <h3>Loan Balance</h3>
                <p>{parseFloat(userData.loanBalance).toFixed(4)} dDAI</p>
              </div>
              <div className="stat-card">
                <h3>Accrued Interest</h3>
                <p>{parseFloat(userData.accruedInterest).toFixed(4)} dDAI</p>
              </div>
              <div className="stat-card">
                <h3>Total Debt</h3>
                <p>{parseFloat(userData.totalDebt).toFixed(4)} dDAI</p>
              </div>
              <div className="stat-card">
                <h3>Collateralization Ratio</h3>
                <p>{collateralizationRatio()}</p>
              </div>
              <div className="stat-card">
                <h3>Max Borrowable</h3>
                <p>{maxBorrowable()} dDAI</p>
              </div>
            </div>
          </section>

          {/* Token Balances */}
          <section className="balances-section">
            <h2>Your Token Balances</h2>
            <div className="balance-grid">
              <div className="balance-card">
                <h3>cUSD (Collateral)</h3>
                <p>{parseFloat(tokenBalances.collateral).toFixed(4)}</p>
              </div>
              <div className="balance-card">
                <h3>dDAI (Loan)</h3>
                <p>{parseFloat(tokenBalances.loan).toFixed(4)}</p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="actions-section">
            <h2>Actions</h2>
            <div className="actions-grid">
              {/* Deposit Collateral */}
              <div className="action-card">
                <h3>Deposit Collateral</h3>
                <input
                  type="number"
                  placeholder="Amount in cUSD"
                  value={amounts.deposit}
                  onChange={(e) => setAmounts({ ...amounts, deposit: e.target.value })}
                  aria-label="Deposit amount in cUSD"
                />
                <button 
                  onClick={deposit} 
                  disabled={loading.deposit || !amounts.deposit || networkMismatch}
                  className="action-button deposit-button"
                  aria-label="Deposit Collateral"
                >
                  {loading.deposit ? 'Processing...' : 'Deposit'}
                </button>
              </div>

              {/* Borrow */}
              <div className="action-card">
                <h3>Borrow dDAI</h3>
                <input
                  type="number"
                  placeholder="Amount in dDAI"
                  value={amounts.borrow}
                  onChange={(e) => setAmounts({ ...amounts, borrow: e.target.value })}
                  aria-label="Borrow amount in dDAI"
                />
                <button 
                  onClick={borrow} 
                  disabled={loading.borrow || !amounts.borrow || userData.collateralBalance === '0'}
                  className="action-button borrow-button"
                  aria-label="Borrow dDAI"
                >
                  {loading.borrow ? 'Processing...' : 'Borrow'}
                </button>
              </div>

              {/* Repay */}
              <div className="action-card">
                <h3>Repay Loan</h3>
                <p>Total debt: {parseFloat(userData.totalDebt).toFixed(4)} dDAI</p>
                <button 
                  onClick={repay} 
                  disabled={loading.repay || userData.totalDebt === '0'}
                  className="action-button repay-button"
                  aria-label="Repay Loan"
                >
                  {loading.repay ? 'Processing...' : 'Repay All'}
                </button>
              </div>

              {/* Withdraw */}
              <div className="action-card">
                <h3>Withdraw Collateral</h3>
                <p>Available: {parseFloat(userData.collateralBalance).toFixed(4)} cUSD</p>
                <button 
                  onClick={withdraw} 
                  disabled={loading.withdraw || parseFloat(userData.collateralBalance) === 0 || parseFloat(userData.totalDebt) !== 0}
                  className="action-button withdraw-button"
                  aria-label="Withdraw Collateral"
                >
                  {loading.withdraw ? 'Processing...' : 'Withdraw All'}
                </button>
              </div>
            </div>
          </section>

          {/* Protocol Stats */}
          <section className="protocol-section">
            <h2>Protocol Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Collateral</h3>
                <p>{parseFloat(protocolStats.totalCollateral).toFixed(2)} cUSD</p>
              </div>
              <div className="stat-card">
                <h3>Total Loans</h3>
                <p>{parseFloat(protocolStats.totalLoans).toFixed(2)} dDAI</p>
              </div>
              <div className="stat-card">
                <h3>Available Liquidity</h3>
                <p>{parseFloat(protocolStats.liquidity).toFixed(2)} dDAI</p>
              </div>
            </div>
          </section>

          {/* Show network mismatch warning */}
          {networkMismatch && (
            <div style={{ background: '#ffcccc', color: '#900', padding: '1em', textAlign: 'center' }}>
              <strong>Network mismatch:</strong> Please switch your wallet to the correct network.
            </div>
          )}

          {/* Show transaction info if present */}
          {txInfo.hash && (
            <div className="tx-info">
              <strong>Transaction sent:</strong> <a href={txInfo.link} target="_blank" rel="noopener noreferrer">{txInfo.hash}</a>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;