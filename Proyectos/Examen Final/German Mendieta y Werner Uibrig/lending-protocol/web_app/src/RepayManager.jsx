import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import contract artifacts from the correct location
import lendingArtifact from '../../artifacts/contracts/LendingProtocol.sol/LendingProtocol.json';
import loanTokenArtifact from '../../artifacts/contracts/LoanToken.sol/LoanToken.json';

// Extract just the ABI arrays from the artifacts
const lendingABI = lendingArtifact.abi;
const loanTokenABI = loanTokenArtifact.abi;

export default function RepayManager({ signer, account, provider }) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [debtInfo, setDebtInfo] = useState({
    principalDebt: '0',
    totalWithInterest: '0',
    interestAmount: '0',
    weeksPassed: '0',
    nextWeekInterest: '0'
  });
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState('0');

  // Computed values
  const hasDebt = parseFloat(debtInfo.principalDebt) > 0;
  const canAffordRepayment = parseFloat(userBalance) >= parseFloat(debtInfo.totalWithInterest);

  useEffect(() => {
    const loadDebtAndBalance = async () => {
      if (!signer || !account) return;

      try {
        setError('');

        const lendingAddress = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
        const loanTokenAddress = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;

        if (!lendingAddress || !loanTokenAddress) {
          setError('Contracts not deployed. Please run: npm run setup');
          return;
        }

        const lendingContract = new ethers.Contract(
          lendingAddress,
          lendingABI,
          signer
        );

        const loanTokenContract = new ethers.Contract(
          loanTokenAddress,
          loanTokenABI,
          signer
        );

        // Get user position
        const userData = await lendingContract.getUserData(account);
        const balance = await loanTokenContract.balanceOf(account);
        setUserBalance(ethers.formatEther(balance));

        // Extract position data
        const [collateral, debt, totalInterest, weeksPassed, maxBorrowAmount] = userData;

        const principalDebt = ethers.formatEther(debt);
        const accruedInterest = ethers.formatEther(totalInterest);

        // Calculate total repayment (principal + accrued + next week interest)
        const currentDebt = parseFloat(principalDebt);
        const nextWeekInterest = currentDebt * 0.05; // 5% of current debt
        const totalDebtAfterRepay = currentDebt + parseFloat(accruedInterest) + nextWeekInterest;

        setDebtInfo({
          principalDebt,
          totalWithInterest: totalDebtAfterRepay.toFixed(6),
          interestAmount: accruedInterest,
          weeksPassed: weeksPassed.toString(),
          nextWeekInterest: nextWeekInterest.toFixed(6)
        });

      } catch (error) {
        console.error('Error loading debt and balance:', error);
        setError('Error al cargar datos de deuda');
      }
    };

    loadDebtAndBalance();

    // Refresh every 10 seconds
    const interval = setInterval(loadDebtAndBalance, 10000);
    return () => clearInterval(interval);
  }, [signer, account, provider]);

  const repayDebt = async () => {
    if (!signer || !hasDebt || !canAffordRepayment) return;

    setLoading(true);
    setTxHash('');
    setError('');

    try {
      const lendingAddress = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
      const loanTokenAddress = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;

      const lendingContract = new ethers.Contract(
        lendingAddress,
        lendingABI,
        signer
      );

      const loanTokenContract = new ethers.Contract(
        loanTokenAddress,
        loanTokenABI,
        signer
      );

      // Calculate total amount to repay
      const totalRepayAmount = ethers.parseEther(debtInfo.totalWithInterest);

      // Step 1: Approve the lending contract to spend loan tokens
      const approveTx = await loanTokenContract.approve(lendingAddress, totalRepayAmount);
      await approveTx.wait();

      // Step 2: Call repay function
      const repayTx = await lendingContract.repay();
      const receipt = await repayTx.wait();

      setTxHash(receipt.hash);

      // Reset debt info after successful repayment
      setDebtInfo({
        principalDebt: '0',
        totalWithInterest: '0',
        interestAmount: '0',
        weeksPassed: '0',
        nextWeekInterest: '0'
      });

      // Refresh balance
      const newBalance = await loanTokenContract.balanceOf(account);
      setUserBalance(ethers.formatEther(newBalance));

    } catch (error) {
      console.error('Error repaying debt:', error);
      setError('Error al pagar deuda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="action-card">
      <h3>💳 Pagar Deuda</h3>
      
      {error && (
        <div className="error-msg">
          ❌ {error}
        </div>
      )}

      <div className="info-section">
        <div className="info-row">
          <span>Deuda principal:</span>
          <span className="amount">{parseFloat(debtInfo.principalDebt).toFixed(4)} dDAI</span>
        </div>
        <div className="info-row">
          <span>Interés acumulado:</span>
          <span className="amount">{parseFloat(debtInfo.interestAmount).toFixed(4)} dDAI</span>
        </div>
        <div className="info-row">
          <span>Interés próxima semana (5%):</span>
          <span className="amount">{parseFloat(debtInfo.nextWeekInterest || '0').toFixed(4)} dDAI</span>
        </div>
        <div className="info-row">
          <span><strong>Total a pagar:</strong></span>
          <span className="amount"><strong>{parseFloat(debtInfo.totalWithInterest).toFixed(4)} dDAI</strong></span>
        </div>
        <div className="info-row">
          <span>Tu balance:</span>
          <span className={`amount ${canAffordRepayment ? 'success' : 'error'}`}>
            {parseFloat(userBalance).toFixed(4)} dDAI
          </span>
        </div>
      </div>

      {!canAffordRepayment && hasDebt && (
        <div className="warning-msg">
          ⚠️ Balance insuficiente. Necesitas {(parseFloat(debtInfo.totalWithInterest) - parseFloat(userBalance)).toFixed(4)} dDAI más.
        </div>
      )}

      <button 
        onClick={repayDebt}
        disabled={loading || !hasDebt || !canAffordRepayment}
        className={`action-btn ${canAffordRepayment && hasDebt ? 'secondary' : 'disabled'}`}
      >
        {loading ? (
          'Procesando...'
        ) : !hasDebt ? (
          'Sin deuda para pagar'
        ) : !canAffordRepayment ? (
          'Balance insuficiente'
        ) : (
          `Pagar ${parseFloat(debtInfo.totalWithInterest).toFixed(4)} dDAI`
        )}
      </button>

      <div className="info">
        <small>
          💡 Al pagar, se simula una semana más y se calcula 5% de interés. 
          Pagas: principal + interés acumulado + interés de la semana.
        </small>
      </div>

      {txHash && (
        <div className="success-msg">
          ✅ Pago exitoso: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </div>
      )}
    </div>
  );
}