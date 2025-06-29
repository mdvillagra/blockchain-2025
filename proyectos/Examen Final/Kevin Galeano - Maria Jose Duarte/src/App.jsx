import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses - Updated for Sepolia deployment
const CONTRACT_ADDRESSES = {
  collateralToken: "0xBb0d0E7534Cb381e1aE0a02bA5c0105f0c79B4E9",
  loanToken: "0x8343444CED87979dde24d9F6d0f68B3854664Db9",
  lendingProtocol: "0x2E4eb9887127Ae7138Ee7A3E39C1D4Dc2E101fB7",
};

// Sepolia Chain ID
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

// Contract ABIs
const LENDING_PROTOCOL_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function borrow(uint256 amount) external",
  "function repay() external",
  "function withdrawCollateral() external",
  "function getUserData(address user) external view returns (uint256, uint256, uint256)",
  "function collateralToken() external view returns (address)",
  "function loanToken() external view returns (address)"
];

const TOKEN_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function mint(address to, uint256 amount) external"
];

const App = () => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [userBalance, setUserBalance] = useState({
    collateral: '0',
    loan: '0'
  });
  const [userPosition, setUserPosition] = useState({
    collateral: '0',
    debt: '0',
    interest: '0'
  });
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [networkError, setNetworkError] = useState('');

  // Check if connected to Sepolia
  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setNetworkError('Please connect to Sepolia testnet');
        return false;
      }
      setNetworkError('');
      return true;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setNetworkError('');
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  };

  // Get test tokens
  const getTestTokens = async () => {
    if (!contracts.collateralToken || !contracts.loanToken) return;

    try {
      setLoading(true);
      const mintAmount = ethers.parseEther("1000"); // Mint 1000 tokens

      // Mint collateral tokens (cUSD)
      const mintCollateralTx = await contracts.collateralToken.mint(account, mintAmount);
      await mintCollateralTx.wait();

      // Mint loan tokens (dDAI)
      const mintLoanTx = await contracts.loanToken.mint(account, mintAmount);
      await mintLoanTx.wait();

      alert('Test tokens minted successfully! You received 1000 cUSD and 1000 dDAI');
      await loadUserData();
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Failed to mint test tokens. Make sure you are the contract owner or tokens are publicly mintable.');
    } finally {
      setLoading(false);
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      // Check network first
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        const switched = await switchToSepolia();
        if (!switched) return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);

      // Initialize contracts
      const lendingProtocol = new ethers.Contract(
        CONTRACT_ADDRESSES.lendingProtocol,
        LENDING_PROTOCOL_ABI,
        signer
      );

      const collateralToken = new ethers.Contract(
        CONTRACT_ADDRESSES.collateralToken,
        TOKEN_ABI,
        signer
      );

      const loanToken = new ethers.Contract(
        CONTRACT_ADDRESSES.loanToken,
        TOKEN_ABI,
        signer
      );

      setContracts({
        lendingProtocol,
        collateralToken,
        loanToken
      });

      console.log('Connected to account:', accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  // Load user data
  const loadUserData = async () => {
    if (!contracts.lendingProtocol || !account) return;

    try {
      // Get user balances
      const collateralBalance = await contracts.collateralToken.balanceOf(account);
      const loanBalance = await contracts.loanToken.balanceOf(account);

      setUserBalance({
        collateral: ethers.formatEther(collateralBalance),
        loan: ethers.formatEther(loanBalance)
      });

      // Get user position
      const [collateral, debt, interest] = await contracts.lendingProtocol.getUserData(account);
      
      setUserPosition({
        collateral: ethers.formatEther(collateral),
        debt: ethers.formatEther(debt),
        interest: ethers.formatEther(interest)
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Deposit collateral
  const deposit = async () => {
    if (!depositAmount || !contracts.lendingProtocol) return;

    try {
      setLoading(true);
      const amount = ethers.parseEther(depositAmount);
      
      // First approve the spending
      const approveTx = await contracts.collateralToken.approve(
        CONTRACT_ADDRESSES.lendingProtocol,
        amount
      );
      await approveTx.wait();

      // Then deposit
      const depositTx = await contracts.lendingProtocol.depositCollateral(amount);
      await depositTx.wait();

      alert('Collateral deposited successfully!');
      setDepositAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Failed to deposit collateral');
    } finally {
      setLoading(false);
    }
  };

  // Borrow tokens
  const borrow = async () => {
    if (!borrowAmount || !contracts.lendingProtocol) return;

    try {
      setLoading(true);
      const amount = ethers.parseEther(borrowAmount);
      
      const borrowTx = await contracts.lendingProtocol.borrow(amount);
      await borrowTx.wait();

      alert('Loan borrowed successfully!');
      setBorrowAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error borrowing:', error);
      alert('Failed to borrow tokens');
    } finally {
      setLoading(false);
    }
  };

  // Repay loan
  const repay = async () => {
    if (!contracts.lendingProtocol) return;

    try {
      setLoading(true);
      
      // Calculate total debt
      const totalDebt = ethers.parseEther(
        (parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toString()
      );

      // First approve the spending
      const approveTx = await contracts.loanToken.approve(
        CONTRACT_ADDRESSES.lendingProtocol,
        totalDebt
      );
      await approveTx.wait();

      // Then repay
      const repayTx = await contracts.lendingProtocol.repay();
      await repayTx.wait();

      alert('Loan repaid successfully!');
      await loadUserData();
    } catch (error) {
      console.error('Error repaying:', error);
      alert('Failed to repay loan');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw collateral
  const withdraw = async () => {
    if (!contracts.lendingProtocol) return;

    try {
      setLoading(true);
      
      const withdrawTx = await contracts.lendingProtocol.withdrawCollateral();
      await withdrawTx.wait();

      alert('Collateral withdrawn successfully!');
      await loadUserData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Failed to withdraw collateral');
    } finally {
      setLoading(false);
    }
  };

  // Calculate max borrowable amount
  const getMaxBorrowable = () => {
    const collateralValue = parseFloat(userPosition.collateral);
    const currentDebt = parseFloat(userPosition.debt) + parseFloat(userPosition.interest);
    const maxBorrowable = (collateralValue * 100) / 150; // 150% collateralization ratio
    return Math.max(0, maxBorrowable - currentDebt).toFixed(6);
  };

  useEffect(() => {
    if (contracts.lendingProtocol && account) {
      loadUserData();
    }
  }, [contracts, account]);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount('');
          setContracts({});
          setProvider(null);
          setSigner(null);
        } else if (accounts[0] !== account) {
          // User changed account
          connectWallet();
        }
      };

      const handleChainChanged = (chainId) => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account]);

  // Check network on mount and when account connects
  useEffect(() => {
    if (account) {
      checkNetwork();
    }
  }, [account]);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            margin: '0 0 10px 0',
            background: 'linear-gradient(45deg, #fff, #f0f8ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DeFi Lending Protocol
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Deposit cUSD collateral, borrow dDAI with 150% collateralization
          </p>
        </div>

        {/* Wallet Connection */}
        {!account ? (
          <div style={{ textAlign: 'center' }}>
            {networkError && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                color: '#ff6b6b'
              }}>
                <p>{networkError}</p>
                <button
                  onClick={switchToSepolia}
                  style={{
                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Switch to Sepolia
                </button>
              </div>
            )}
            <button
              onClick={connectWallet}
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              Connect MetaMask
            </button>
          </div>
        ) : (
          <div>
            {/* Network Error Warning */}
            {networkError && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                color: '#ff6b6b',
                textAlign: 'center'
              }}>
                <p>{networkError}</p>
                <button
                  onClick={switchToSepolia}
                  style={{
                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Switch to Sepolia
                </button>
              </div>
            )}

            {/* Account Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderRadius: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3>Connected Account (Sepolia Testnet)</h3>
              <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {account}
              </p>
              <button
                onClick={getTestTokens}
                disabled={loading}
                style={{
                  background: loading ? '#666' : 'linear-gradient(45deg, #17a2b8, #138496)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '10px',
                  fontSize: '0.9rem'
                }}
              >
                {loading ? 'Minting...' : 'Get Test Tokens (1000 each)'}
              </button>
            </div>

            {/* User Balances */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '15px'
              }}>
                <h3>Your Balances</h3>
                <p>cUSD (Collateral): {parseFloat(userBalance.collateral).toFixed(4)}</p>
                <p>dDAI (Loan): {parseFloat(userBalance.loan).toFixed(4)}</p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '15px'
              }}>
                <h3>Your Position</h3>
                <p>Collateral Deposited: {parseFloat(userPosition.collateral).toFixed(4)} cUSD</p>
                <p>Current Debt: {parseFloat(userPosition.debt).toFixed(4)} dDAI</p>
                <p>Accrued Interest: {parseFloat(userPosition.interest).toFixed(4)} dDAI</p>
                <p>Max Borrowable: {getMaxBorrowable()} dDAI</p>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {/* Deposit */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '15px'
              }}>
                <h3>Deposit Collateral</h3>
                <input
                  type="number"
                  placeholder="Amount of cUSD"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    marginBottom: '10px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={deposit}
                  disabled={loading || !depositAmount}
                  style={{
                    width: '100%',
                    background: loading ? '#666' : 'linear-gradient(45deg, #28a745, #20c997)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
              </div>

              {/* Borrow */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '15px'
              }}>
                <h3>Borrow dDAI</h3>
                <input
                  type="number"
                  placeholder="Amount of dDAI"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    marginBottom: '10px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={borrow}
                  disabled={loading || !borrowAmount}
                  style={{
                    width: '100%',
                    background: loading ? '#666' : 'linear-gradient(45deg, #007bff, #6610f2)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Processing...' : 'Borrow'}
                </button>
              </div>

              {/* Repay */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '15px'
              }}>
                <h3>Repay Loan</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                  Total to repay: {(parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toFixed(4)} dDAI
                </p>
                <button
                  onClick={repay}
                  disabled={loading || parseFloat(userPosition.debt) === 0}
                  style={{
                    width: '100%',
                    background: loading || parseFloat(userPosition.debt) === 0 ? '#666' : 'linear-gradient(45deg, #ffc107, #fd7e14)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: loading || parseFloat(userPosition.debt) === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Processing...' : 'Repay All'}
                </button>
              </div>

              {/* Withdraw */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '15px'
              }}>
                <h3>Withdraw Collateral</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                  Available: {userPosition.collateral} cUSD
                </p>
                <button
                  onClick={withdraw}
                  disabled={loading || parseFloat(userPosition.debt) > 0 || parseFloat(userPosition.collateral) === 0}
                  style={{
                    width: '100%',
                    background: loading || parseFloat(userPosition.debt) > 0 || parseFloat(userPosition.collateral) === 0 ? '#666' : 'linear-gradient(45deg, #dc3545, #e83e8c)',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: loading || parseFloat(userPosition.debt) > 0 || parseFloat(userPosition.collateral) === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Processing...' : 'Withdraw All'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderRadius: '15px',
              marginTop: '30px',
              textAlign: 'center'
            }}>
              <h3>Protocol Information</h3>
              <p>• Collateralization Ratio: 150% (you can borrow up to 66.67% of your collateral value)</p>
              <p>• Interest Rate: 5% per week (non-compounding)</p>
              <p>• Exchange Rate: 1 cUSD = 1 dDAI</p>
              <p>• You must repay all debt before withdrawing collateral</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 