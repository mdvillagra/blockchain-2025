import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import lendingABI from './LendingProtocolABI.json';

export default function WithdrawManager({ signer, account }) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [userPosition, setUserPosition] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUserPosition = async () => {
      if (!signer || !account) return;
      
      try {
        const lendingContract = new ethers.Contract(
          import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS,
          lendingABI,
          signer
        );
        
        const userData = await lendingContract.getUserData(account);
        setUserPosition({
          collateral: ethers.formatEther(userData.collateral),
          debt: ethers.formatEther(userData.debt),
          totalInterest: ethers.formatEther(userData.totalInterest),
          weeksPassed: userData.weeksPassed.toString(),
          maxBorrowAmount: ethers.formatEther(userData.maxBorrowAmount)
        });
        setError('');
      } catch (error) {
        console.error('Error loading user position:', error);
        setError('Error loading user data');
      }
    };
    
    loadUserPosition();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadUserPosition, 10000);
    return () => clearInterval(interval);
  }, [signer, account]);

  const withdrawCollateral = async () => {
    if (!signer || !userPosition) return;
    
    // Check if user has any collateral to withdraw
    if (parseFloat(userPosition.collateral) === 0) {
      alert('No tienes colateral para retirar');
      return;
    }
    
    // Check if user has pending debt
    if (parseFloat(userPosition.debt) > 0) {
      alert('No puedes retirar colateral con deuda pendiente. Primero debes pagar tu deuda.');
      return;
    }
    
    // Confirm withdrawal
    const confirmMessage = `¿Estás seguro de que quieres retirar todo tu colateral?\n\nSe retirarán: ${parseFloat(userPosition.collateral).toFixed(4)} cUSD`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    setLoading(true);
    setTxHash('');
    setError('');
    
    try {
      const lendingContract = new ethers.Contract(
        import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS,
        lendingABI,
        signer
      );
      
      // Call withdrawCollateral without parameters - it withdraws all collateral
      const withdrawTx = await lendingContract.withdrawCollateral();
      const receipt = await withdrawTx.wait();
      
      setTxHash(receipt.hash);
      
      // Update user position to reflect withdrawal
      setUserPosition(prev => ({
        ...prev,
        collateral: '0'
      }));
      
      alert(`✅ Colateral retirado exitosamente: ${parseFloat(userPosition.collateral).toFixed(4)} cUSD`);
      
    } catch (error) {
      console.error('Error withdrawing collateral:', error);
      let errorMessage = 'Error al retirar colateral';
      
      if (error.message.includes('Cannot withdraw with pending debt')) {
        errorMessage = 'No puedes retirar colateral con deuda pendiente';
      } else if (error.message.includes('No collateral to withdraw')) {
        errorMessage = 'No tienes colateral para retirar';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transacción rechazada por el usuario';
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transacción rechazada por el usuario';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!userPosition) {
    return (
      <div className="action-card">
        <h3>💎 Retirar Colateral</h3>
        <div className="loading">Cargando información del usuario...</div>
      </div>
    );
  }

  const hasCollateral = parseFloat(userPosition.collateral) > 0;
  const hasDebt = parseFloat(userPosition.debt) > 0;
  const canWithdraw = hasCollateral && !hasDebt;

  return (
    <div className="action-card">
      <h3>💎 Retirar Colateral</h3>
      
      <div className="info-section">
        <div className="info-row">
          <span>Tu colateral actual:</span>
          <span className="amount">
            {parseFloat(userPosition.collateral).toFixed(4)} cUSD
          </span>
        </div>
        <div className="info-row">
          <span>Deuda pendiente:</span>
          <span className={`amount ${hasDebt ? 'debt' : 'no-debt'}`}>
            {parseFloat(userPosition.debt).toFixed(4)} dDAI
          </span>
        </div>
      </div>

      {error && (
        <div className="error-msg">
          ❌ {error}
        </div>
      )}

      {!hasCollateral && (
        <div className="warning-msg">
          ⚠️ No tienes colateral depositado para retirar
        </div>
      )}

      {hasDebt && (
        <div className="warning-msg">
          ⚠️ No puedes retirar colateral mientras tengas deuda pendiente. 
          Primero debes pagar tu deuda de {parseFloat(userPosition.debt).toFixed(4)} dDAI.
        </div>
      )}

      {canWithdraw && (
        <div className="success-msg">
          ✅ Puedes retirar todo tu colateral: {parseFloat(userPosition.collateral).toFixed(4)} cUSD
        </div>
      )}

      <button 
        onClick={withdrawCollateral}
        disabled={loading || !canWithdraw}
        className={`action-btn ${canWithdraw ? 'primary' : 'disabled'}`}
      >
        {loading ? (
          'Procesando...'
        ) : !hasCollateral ? (
          'No hay colateral para retirar'
        ) : hasDebt ? (
          'Paga tu deuda primero'
        ) : (
          `Retirar ${parseFloat(userPosition.collateral).toFixed(4)} cUSD`
        )}
      </button>

      <div className="info">
        <small>
          ⚠️ Al retirar colateral se retirará todo el monto depositado. 
          Solo puedes retirar si no tienes deuda pendiente.
        </small>
      </div>

      {txHash && (
        <div className="success-msg">
          ✅ Retiro exitoso: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </div>
      )}
    </div>
  );
}