export default function UserDashboard({
  userData,
  depositAmount,
  setDepositAmount,
  borrowAmount,
  setBorrowAmount,
  deposit,
  borrow,
  repay,
  withdraw,
}) {
  return (
    <div className="dashboard">
      <div className="monitor-panel">
        <div className="monitor-item">
          <div className="monitor-label">Colateral (cUSD)</div>
          <div className="monitor-value collateral">{parseFloat(userData.collateral).toFixed(2)}</div>
        </div>
        <div className="monitor-item">
          <div className="monitor-label">Deuda (dDAI)</div>
          <div className="monitor-value debt">{parseFloat(userData.debt).toFixed(2)}</div>
        </div>
        <div className="monitor-item">
          <div className="monitor-label">Interés (dDAI)</div>
          <div className="monitor-value interest">{parseFloat(userData.interest).toFixed(2)}</div>
        </div>
      </div>
      <div className="action-panel">
        <div className="action-group">
          <h3 className="action-title">Depositar Colateral</h3>
          <div className="action-form">
            <input
              type="number"
              className="action-input"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Monto en cUSD"
              min="0"
              step="0.01"
            />
            <button className="action-button deposit" onClick={deposit}></button>
          </div>
        </div>
        <div className="action-group">
          <h3 className="action-title">Pedir Prestado</h3>
          <div className="action-form">
            <input
              type="number"
              className="action-input"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="Monto en dDAI"
              min="0"
              step="0.01"
            />
            <button className="action-button borrow" onClick={borrow}></button>
          </div>
        </div>
        <div className="action-buttons">
          <button className="action-button repay" onClick={repay}>Pagar Préstamo</button>
          <button className="action-button withdraw" onClick={withdraw}>Retirar Colateral</button>
        </div>
      </div>
    </div>
  );
}