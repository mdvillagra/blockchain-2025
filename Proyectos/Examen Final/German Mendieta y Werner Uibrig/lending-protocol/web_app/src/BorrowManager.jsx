import { useState } from 'react';
import { ethers } from 'ethers';
import lendingABI from './LendingProtocolABI.json';

export default function BorrowManager({ signer, account }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const borrowTokens = async () => {
    if (!amount || !signer) return;
    
    setLoading(true);
    setTxHash('');
    
    try {
      const lendingContract = new ethers.Contract(
        import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS,
        lendingABI,
        signer
      );
      
      const amountWei = ethers.parseEther(amount);
      const borrowTx = await lendingContract.borrow(amountWei);
      const receipt = await borrowTx.wait();
      
      setTxHash(receipt.hash);
      setAmount('');
      
    } catch (error) {
      console.error('Error borrowing:', error);
      alert('Error al solicitar préstamo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="action-card">
      <h3>🏦 Solicitar Préstamo</h3>
      <div className="input-group">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Cantidad de tokens LOAN"
          disabled={loading}
        />
        <button 
          onClick={borrowTokens}
          disabled={loading || !amount}
          className="action-btn secondary"
        >
          {loading ? 'Procesando...' : 'Pedir Préstamo'}
        </button>
      </div>
      <div className="info">
        <small>Ratio de colateralización: 150%</small>
      </div>
      {txHash && (
        <div className="success-msg">
          ✅ Préstamo exitoso: {txHash.slice(0, 10)}...
        </div>
      )}
    </div>
  );
}

