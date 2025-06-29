import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import contract artifacts from the correct location
import collateralArtifact from '../../artifacts/contracts/CollateralToken.sol/CollateralToken.json';
import lendingArtifact from '../../artifacts/contracts/LendingProtocol.sol/LendingProtocol.json';

// Extract just the ABI arrays from the artifacts
const collateralABI = collateralArtifact.abi;
const lendingABI = lendingArtifact.abi;

export default function CollateralManager({ signer, account, provider }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState('0');
  const [currentAllowance, setCurrentAllowance] = useState('0');

  useEffect(() => {
    const loadBalanceAndAllowance = async () => {
      if (!signer || !account) return;
      
      try {
        setError('');
        
        // Check if contracts are deployed
        const collateralAddress = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
        const lendingAddress = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
        
        if (!collateralAddress || !lendingAddress) {
          setError('Contracts not deployed. Please run: npm run setup');
          return;
        }

        // Validate network
        if (provider) {
          const network = await provider.getNetwork();
          if (network.chainId !== 31337n) {
            setError('Wrong network. Please switch to Hardhat Local (Chain ID: 31337)');
            return;
          }
        }

        const collateralContract = new ethers.Contract(
          collateralAddress,
          collateralABI,
          signer
        );
        
        // Get user's collateral token balance
        const balance = await collateralContract.balanceOf(account);
        setUserBalance(ethers.formatEther(balance));
        
        // Get current allowance
        const allowance = await collateralContract.allowance(account, lendingAddress);
        setCurrentAllowance(ethers.formatEther(allowance));
        
      } catch (error) {
        console.error('Error loading balance and allowance:', error);
        setError('Error al cargar datos de colateral');
      }
    };
    
    loadBalanceAndAllowance();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadBalanceAndAllowance, 10000);
    return () => clearInterval(interval);
  }, [signer, account, provider]);

  const depositCollateral = async () => {
    if (!amount || !signer) {
      alert('Por favor ingresa una cantidad');
      return;
    }
    
    const amountValue = parseFloat(amount);
    const balanceValue = parseFloat(userBalance);
    
    if (amountValue <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (amountValue > balanceValue) {
      alert(`Balance insuficiente. Tienes ${balanceValue.toFixed(4)} cUSD`);
      return;
    }
    
    setLoading(true);
    setTxHash('');
    setError('');
    
    try {
      const collateralAddress = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
      const lendingAddress = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
      
      // First approve the lending protocol to spend tokens
      const collateralContract = new ethers.Contract(
        collateralAddress,
        collateralABI,
        signer
      );
      
      const amountWei = ethers.parseEther(amount);
      
      // Check if we need to approve more tokens
      const currentAllowanceWei = ethers.parseEther(currentAllowance);
      
      if (currentAllowanceWei < amountWei) {
        // Approve transaction
        const approveTx = await collateralContract.approve(lendingAddress, amountWei);
        await approveTx.wait();
        
        // Update allowance display
        setCurrentAllowance(ethers.formatEther(amountWei));
      }
      
      // Deposit transaction
      const lendingContract = new ethers.Contract(
        lendingAddress,
        lendingABI,
        signer
      );
      
      const depositTx = await lendingContract.depositCollateral(amountWei);
      const receipt = await depositTx.wait();
      
      setTxHash(receipt.hash);
      setAmount('');
      
      // Update balance (subtract deposited amount)
      const newBalance = balanceValue - amountValue;
      setUserBalance(newBalance.toString());
      
    } catch (error) {
      console.error('Error depositing collateral:', error);
      setError('Error al depositar colateral: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const maxDeposit = () => {
    setAmount(userBalance);
  };

  if (error) {
    return (
      <div className="action-card">
        <h3>💎 Depositar Colateral</h3>
        <div className="error-msg">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="action-card">
      <h3>💎 Depositar Colateral</h3>
      
      <div className="info-section">
        <div className="info-row">
          <span>Tu balance cUSD:</span>
          <span className="amount">{parseFloat(userBalance).toFixed(4)} cUSD</span>
        </div>
        <div className="info-row">
          <span>Allowance actual:</span>
          <span className="amount">{parseFloat(currentAllowance).toFixed(4)} cUSD</span>
        </div>
      </div>

      <div className="input-group">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Cantidad de cUSD a depositar"
          disabled={loading}
          step="0.01"
          min="0"
          max={userBalance}
        />
        <button
          onClick={maxDeposit}
          disabled={loading || parseFloat(userBalance) === 0}
          className="max-btn"
        >
          Max
        </button>
      </div>

      {amount && (
        <div className="info">
          <small>
            💡 Con {amount} cUSD puedes pedir hasta {(parseFloat(amount) / 1.5).toFixed(4)} dDAI
          </small>
        </div>
      )}
      
      <button 
        onClick={depositCollateral}
        disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(userBalance)}
        className={`action-btn ${loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(userBalance) ? 'disabled' : 'primary'}`}
      >
        {loading ? (
          'Procesando...'
        ) : !amount ? (
          'Ingresa cantidad'
        ) : parseFloat(amount) <= 0 ? (
          'Cantidad debe ser > 0'
        ) : parseFloat(amount) > parseFloat(userBalance) ? (
          'Balance insuficiente'
        ) : (
          `Depositar ${parseFloat(amount).toFixed(4)} cUSD`
        )}
      </button>
      
      <div className="info">
        <small>Ratio de colateralización: 150%</small>
      </div>

      {txHash && (
        <div className="success-msg">
          ✅ Colateral depositado: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </div>
      )}
    </div>
  );
}