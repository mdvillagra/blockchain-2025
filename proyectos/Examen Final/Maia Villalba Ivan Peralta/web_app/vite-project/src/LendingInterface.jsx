function LendingInterface({
  account,
  connectWallet,
  collateral,
  debt,
  interest,
  amount,
  setAmount,
  deposit,
  borrow,
  repay,
  withdraw,
  tokenBalances,
  checkTokenBalances
}) {
  return (
    <div className="lending-app">
      <h1>DApp de Préstamos</h1>

      {!account ? (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      ) : (
        <>
          <div className="info-box">
            <p><strong>Cuenta:</strong> {account}</p>
            <p><strong>Colateral:</strong> {collateral} cUSD</p>
            <p><strong>Deuda:</strong> {debt} dDAI</p>
            <p><strong>Interés:</strong> {interest} dDAI</p>
          </div>

          <div className="info-box">
            <h3>Tus saldos de tokens:</h3>
            <p><strong>cUSD:</strong> {tokenBalances.cUSD}</p>
            <p><strong>dDAI:</strong> {tokenBalances.dDAI}</p>
            <button onClick={checkTokenBalances}>Actualizar saldos</button>
          </div>

          <input type="text" placeholder="Monto (ej: 100)" value={amount} onChange={(e) => setAmount(e.target.value)} className="amount-input"/>

          <div className="button-row">
            <button className="primary" onClick={deposit}>Depositar</button>
            <button className="secondary" onClick={borrow}>Pedir Préstamo</button>
            <button className="repay" onClick={repay} disabled={parseFloat(debt) === 0} >
              Pagar Préstamo
            </button>            
            <button className="withdraw" onClick={withdraw} disabled={parseFloat(debt) != 0 || parseFloat(collateral) === 0}>Retirar Colateral</button>
          </div>
        </>
      )}
    </div>
  );
}

export default LendingInterface;
