import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Importar ABIs desde artefactos compilados
import LendingProtocolArtifact from '../../artifacts/contracts/LendingProtocol.sol/LendingProtocol.json';
import CollateralTokenArtifact from '../../artifacts/contracts/CollateralToken.sol/CollateralToken.json';

// ABIs extraídos de los artefactos
const LENDING_PROTOCOL_ABI = LendingProtocolArtifact.abi;
const ERC20_ABI = CollateralTokenArtifact.abi;

function App() {
  // Estados de la aplicación
  const [account, setAccount] = useState('');
  const [lendingContract, setLendingContract] = useState(null);
  const [collateralToken, setCollateralToken] = useState(null);
  const [loanToken, setLoanToken] = useState(null);
  
  // Estados de datos del usuario
  const [userData, setUserData] = useState({
    collateralBalance: '0',
    loanBalance: '0', 
    interestAccrued: '0'
  });
  
  // Estados de balances de tokens
  const [balances, setBalances] = useState({
    collateralBalance: '0',
    loanBalance: '0'
  });
  
  // Estados de inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  
  // Estados de mint
  const [mintStatus, setMintStatus] = useState({
    canMintCUSD: false,
    canMintDDAI: false,
    nextMintCUSD: 0,
    nextMintDDAI: 0
  });
  
  // Estado de carga
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  


  // Direcciones de contratos (deben estar en variables de entorno)
  const LENDING_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
  const COLLATERAL_TOKEN_ADDRESS = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS || "";  
  const LOAN_TOKEN_ADDRESS = import.meta.env.VITE_LOAN_TOKEN_ADDRESS || "";

  // Función para conectar MetaMask
  const connectWallet = async () => {
    try {
      setError('');
      if (typeof window.ethereum !== 'undefined') {
        // Solicitar acceso a las cuentas
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        console.log('✅ Wallet conectado:', address);
        
        setAccount(address);
        
        // Inicializar contratos
        await initializeContracts(signer);
        
      } else {
        setError('MetaMask no está instalado. Por favor instala MetaMask.');
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      setError('Error conectando wallet: ' + error.message);
    }
  };

  // Función para inicializar contratos
  const initializeContracts = async (signer) => {
    try {
      const lendingContract = new ethers.Contract(
        LENDING_CONTRACT_ADDRESS,
        LENDING_PROTOCOL_ABI,
        signer
      );
      
      const collateralContract = new ethers.Contract(
        COLLATERAL_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      const loanContract = new ethers.Contract(
        LOAN_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      setLendingContract(lendingContract);
      setCollateralToken(collateralContract);
      setLoanToken(loanContract);
      
      // Cargar datos iniciales
      await loadUserData(lendingContract, collateralContract, loanContract, await signer.getAddress());
      
    } catch (error) {
      console.error('Error inicializando contratos:', error);
      setError('Error inicializando contratos: ' + error.message);
    }
  };

  // Función para cargar datos del usuario
  const loadUserData = async (lendingContract, collateralContract, loanContract, userAddress) => {
    try {
      // Obtener datos del protocolo de préstamos
      const [collateralBalance, loanBalance, interestAccrued] = await lendingContract.getUserData(userAddress);
      
      // Obtener balances de tokens del usuario
      const collateralTokenBalance = await collateralContract.balanceOf(userAddress);
      const loanTokenBalance = await loanContract.balanceOf(userAddress);
      
      // Obtener estado de mint
      const canMintCUSD = await collateralContract.canMint(userAddress);
      const canMintDDAI = await loanContract.canMint(userAddress);
      const nextMintCUSD = await collateralContract.getNextMintTime(userAddress);
      const nextMintDDAI = await loanContract.getNextMintTime(userAddress);
      
      setUserData({
        collateralBalance: ethers.formatEther(collateralBalance),
        loanBalance: ethers.formatEther(loanBalance),
        interestAccrued: ethers.formatEther(interestAccrued)
      });
      
      setBalances({
        collateralBalance: ethers.formatEther(collateralTokenBalance),
        loanBalance: ethers.formatEther(loanTokenBalance)
      });
      
      setMintStatus({
        canMintCUSD,
        canMintDDAI,
        nextMintCUSD: Number(nextMintCUSD),
        nextMintDDAI: Number(nextMintDDAI)
      });
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos: ' + error.message);
    }
  };

  // Función para mintear cUSD
  const mintCUSD = async () => {
    if (!collateralToken) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Minteando 1000 cUSD...');
      const mintTx = await collateralToken.mintForTesting();
      await mintTx.wait();
      console.log('cUSD minteados exitosamente');
      
      // Recargar datos
      await loadUserData(lendingContract, collateralToken, loanToken, account);
      
    } catch (error) {
      console.error('Error minteando cUSD:', error);
      
      // No mostrar error si el usuario canceló la transacción
      if (error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.message.includes('rejected') ||
          error.message.includes('denied') ||
          error.code === 4001) {
        console.log('Usuario canceló la transacción');
        return;
      }
      
      let errorMessage = 'Error desconocido';
      if (error.message.includes('Mint cooldown active')) {
        errorMessage = 'Debes esperar 24 horas entre mints';
      } else if (error.message.includes('Daily mint limit reached')) {
        errorMessage = 'Ya has usado tu límite diario de mint';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else {
        errorMessage = error.message;
      }
      
      setError('❌ Error minteando cUSD: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para mintear dDAI
  const mintDDAI = async () => {
    if (!loanToken) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Minteando 1000 dDAI...');
      const mintTx = await loanToken.mintForTesting();
      await mintTx.wait();
      console.log('dDAI minteados exitosamente');
      
      // Recargar datos
      await loadUserData(lendingContract, collateralToken, loanToken, account);
      
    } catch (error) {
      console.error('Error minteando dDAI:', error);
      
      // No mostrar error si el usuario canceló la transacción
      if (error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.message.includes('rejected') ||
          error.message.includes('denied') ||
          error.code === 4001) {
        console.log('Usuario canceló la transacción');
        return;
      }
      
      let errorMessage = 'Error desconocido';
      if (error.message.includes('Mint cooldown active')) {
        errorMessage = 'Debes esperar 24 horas entre mints';
      } else if (error.message.includes('Daily mint limit reached')) {
        errorMessage = 'Ya has usado tu límite diario de mint';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else {
        errorMessage = error.message;
      }
      
      setError('❌ Error minteando dDAI: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para depositar colateral
  const deposit = async () => {
    if (!depositAmount || !lendingContract || !collateralToken) return;
    
    try {
      setLoading(true);
      setError('');
      
      const amount = ethers.parseEther(depositAmount);
      
      console.log('Depositando:', depositAmount, 'cUSD');
      
      // Verificar balance del usuario
      const userBalance = await collateralToken.balanceOf(account);
      
      if (userBalance < amount) {
        throw new Error(`Balance insuficiente. Tienes: ${ethers.formatEther(userBalance)} cUSD`);
      }
      
      // Aprobar el gasto
      console.log('Aprobando tokens...');
      
      // Aprobar tokens
      const approveTx = await collateralToken.approve(LENDING_CONTRACT_ADDRESS, amount);
      await approveTx.wait();
      console.log('Tokens aprobados');
      
      // Depositar colateral
      console.log('Depositando colateral...');
      const depositTx = await lendingContract.depositCollateral(amount);
      await depositTx.wait();
      console.log('Depósito completado');
      
      // Recargar datos
      await loadUserData(lendingContract, collateralToken, loanToken, account);
      setDepositAmount('');
      
              } catch (error) {
      console.error('Error depositando:', error);
      
      // No mostrar error si el usuario canceló la transacción
      if (error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.message.includes('rejected') ||
          error.message.includes('denied') ||
          error.code === 4001) {
        console.log('Usuario canceló la transacción');
        return; // Salir sin mostrar error
      }
      
      // Mensaje de error más detallado para errores reales
      let errorMessage = 'Error desconocido';
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Fondos insuficientes para gas. ¿Tienes ETH en Ephemery?';
      } else if (error.message.includes('Internal JSON-RPC error')) {
        errorMessage = 'Error de RPC. Intenta cambiar a otro RPC de Ephemery (rpc.bordel.wtf/test)';
      } else if (error.message.includes('nonce too high')) {
        errorMessage = 'Error de nonce. Resetea la cuenta en MetaMask (Configuración > Avanzado > Resetear cuenta)';
      } else if (error.message.includes('gas required exceeds allowance')) {
        errorMessage = 'Gas insuficiente. Aumenta el límite de gas en MetaMask';
      } else if (error.message.includes('contrato') && error.message.includes('no existe')) {
        errorMessage = 'Los contratos no están desplegados en esta red. Ejecuta "npm run deploy"';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else {
        errorMessage = error.message;
      }
      
      setError('❌ Error depositando: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para pedir prestado
  const borrowFunds = async () => {
    if (!borrowAmount || !lendingContract) return;
    
    try {
      setLoading(true);
      setError('');
      
      const amount = ethers.parseEther(borrowAmount);
      
      console.log('Solicitando préstamo...');
      const borrowTx = await lendingContract.borrow(amount);
      await borrowTx.wait();
      console.log('Préstamo otorgado');
      
      // Recargar datos
      await loadUserData(lendingContract, collateralToken, loanToken, account);
      setBorrowAmount('');
      
    } catch (error) {
      console.error('Error pidiendo préstamo:', error);
      
      // No mostrar error si el usuario canceló la transacción
      if (error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.message.includes('rejected') ||
          error.message.includes('denied') ||
          error.code === 4001) {
        console.log('Usuario canceló la transacción');
        return; // Salir sin mostrar error
      }
      
      setError('Error pidiendo préstamo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para pagar préstamo
  const repayLoan = async () => {
    if (!lendingContract || !loanToken) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Calcular monto total a pagar
      const totalDebt = ethers.parseEther(
        (parseFloat(userData.loanBalance) + parseFloat(userData.interestAccrued)).toString()
      );
      
      // Aprobar tokens para pago
      console.log('Aprobando tokens para pago...');
      const approveTx = await loanToken.approve(LENDING_CONTRACT_ADDRESS, totalDebt);
      await approveTx.wait();
      
      // Pagar préstamo
      console.log('Pagando préstamo...');
      const repayTx = await lendingContract.repay();
      await repayTx.wait();
      console.log('Préstamo pagado completamente');
      
      // Recargar datos
      await loadUserData(lendingContract, collateralToken, loanToken, account);
      
    } catch (error) {
      console.error('Error pagando préstamo:', error);
      
      // No mostrar error si el usuario canceló la transacción
      if (error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.message.includes('rejected') ||
          error.message.includes('denied') ||
          error.code === 4001) {
        console.log('Usuario canceló la transacción');
        return; // Salir sin mostrar error
      }
      
      setError('Error pagando préstamo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para retirar colateral
  const withdraw = async () => {
    if (!lendingContract) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Retirando colateral...');
      const withdrawTx = await lendingContract.withdrawCollateral();
      await withdrawTx.wait();
      console.log('Colateral retirado');
      
      // Recargar datos
      await loadUserData(lendingContract, collateralToken, loanToken, account);
      
    } catch (error) {
      console.error('Error retirando colateral:', error);
      
      // No mostrar error si el usuario canceló la transacción
      if (error.message.includes('user rejected') || 
          error.message.includes('User denied') ||
          error.message.includes('rejected') ||
          error.message.includes('denied') ||
          error.code === 4001) {
        console.log('Usuario canceló la transacción');
        return; // Salir sin mostrar error
      }
      
      setError('Error retirando colateral: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular máximo que se puede pedir prestado
  const getMaxBorrow = () => {
    const collateral = parseFloat(userData.collateralBalance);
    const currentTotalDebt = parseFloat(userData.loanBalance) + parseFloat(userData.interestAccrued);
    const maxLoanAmount = collateral * 0.66; // 66% del colateral para préstamo principal
    
    // Restar deuda total porque el interés es deuda real que afecta la capacidad
    return Math.max(0, maxLoanAmount - currentTotalDebt);
  };

  // Calcular ratio de salud actual
  const getHealthRatio = () => {
    const collateral = parseFloat(userData.collateralBalance);
    const totalDebt = parseFloat(userData.loanBalance) + parseFloat(userData.interestAccrued);
    if (totalDebt === 0) return "∞";
    return ((collateral / totalDebt) * 100).toFixed(2) + "%";
  };

  // Calcular total a pagar (préstamo + interés)
  const getTotalToPay = () => {
    return parseFloat(userData.loanBalance) + parseFloat(userData.interestAccrued);
  };

  // Calcular colateral disponible para retirar
  const getAvailableToWithdraw = () => {
    const collateral = parseFloat(userData.collateralBalance);
    const loanBalance = parseFloat(userData.loanBalance);
    
    // Solo se puede retirar colateral si NO hay préstamos activos
    if (loanBalance > 0) {
      return 0; // No se puede retirar nada si hay préstamo activo
    }
    
    // Si no hay préstamo activo, se puede retirar todo el colateral
    return collateral;
  };

  // Validar si el monto de préstamo es válido
  const isBorrowAmountValid = () => {
    if (!borrowAmount || borrowAmount === '') return false;
    const requestedAmount = parseFloat(borrowAmount);
    const maxAvailable = getMaxBorrow();
    return requestedAmount > 0 && requestedAmount <= maxAvailable;
  };

  // Validar si el monto de depósito es válido
  const isDepositAmountValid = () => {
    if (!depositAmount || depositAmount === '') return false;
    const requestedAmount = parseFloat(depositAmount);
    const availableBalance = parseFloat(balances.collateralBalance);
    return requestedAmount > 0 && requestedAmount <= availableBalance;
  };

  // Función para formatear tiempo restante para mint
  const getTimeUntilNextMint = (nextMintTime) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = nextMintTime - now;
    
    if (timeLeft <= 0) return 'Disponible ahora';
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    } else {
      return `${minutes}m restantes`;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏦 DApp de Préstamos Descentralizados</h1>
        
        {!account ? (
          <div className="connect-section">
            <p>Conecta tu wallet para comenzar</p>
            <button onClick={connectWallet} className="connect-btn">
              Conectar MetaMask
            </button>
          </div>
        ) : (
          <div className="connected-section">
            <p className="account">Cuenta: {account.substring(0, 6)}...{account.substring(38)}</p>
            
            {error && <div className="error">{error}</div>}
            
            {/* Panel de estado del usuario */}
            <div className="user-stats">
              <h2>📊 Mi Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Colateral Depositado</h3>
                  <p className="amount">{userData.collateralBalance} cUSD</p>
                </div>
                <div className="stat-card">
                  <h3>Préstamo Activo</h3>
                  <p className="amount">{userData.loanBalance} dDAI</p>
                </div>
                <div className="stat-card">
                  <h3>Interés Acumulado</h3>
                  <p className="amount">{userData.interestAccrued} dDAI</p>
                </div>
                <div className="stat-card">
                  <h3>Ratio de Salud</h3>
                  <p className="amount">{getHealthRatio()}</p>
                </div>
                <div className="stat-card">
                  <h3>Total a Pagar</h3>
                  <p className="amount">{getTotalToPay().toFixed(4)} dDAI</p>
                </div>
                <div className="stat-card">
                  <h3>Disponible para Préstamo</h3>
                  <p className="amount">{getMaxBorrow().toFixed(4)} dDAI</p>
                </div>
                <div className="stat-card">
                  <h3>Disponible para Retirar</h3>
                  <p className="amount">{getAvailableToWithdraw().toFixed(4)} cUSD</p>
                </div>
              </div>
            </div>

            {/* Panel de balances de tokens */}
            <div className="token-balances">
              <h3>💰 Tus Balances</h3>
              <p>cUSD: {balances.collateralBalance}</p>
              <p>dDAI: {balances.loanBalance}</p>
            </div>

            {/* Panel de mint de tokens */}
            <div className="mint-tokens-panel">
              <h3>🪙 Obtener Tokens de Prueba</h3>
              <p className="mint-info">Puedes mintear 1000 tokens cada 24 horas de forma gratuita</p>
              
              <div className="mint-section">
                <div className="mint-card">
                  <h4>Mintear cUSD</h4>
                  <p className="mint-status">
                    {mintStatus.canMintCUSD 
                      ? '✅ Disponible para mint' 
                      : `⏳ ${getTimeUntilNextMint(mintStatus.nextMintCUSD)}`
                    }</p>
                  <button 
                    onClick={mintCUSD} 
                    disabled={loading || !mintStatus.canMintCUSD}
                    className="mint-btn"
                  >
                    {loading ? 'Minteando...' : 'Mintear 1000 cUSD'}
                  </button>
                </div>

                <div className="mint-card">
                  <h4>Mintear dDAI</h4>
                  <p className="mint-status">
                    {mintStatus.canMintDDAI 
                      ? '✅ Disponible para mint' 
                      : `⏳ ${getTimeUntilNextMint(mintStatus.nextMintDDAI)}`
                    }
                  </p>
                  <button 
                    onClick={mintDDAI} 
                    disabled={loading || !mintStatus.canMintDDAI}
                    className="mint-btn"
                  >
                    {loading ? 'Minteando...' : 'Mintear 1000 dDAI'}
                  </button>
                </div>
              </div>
            </div>

            {/* Panel de acciones */}
            <div className="actions-panel">
              <div className="action-section">
                <h3>💰 Depositar Colateral</h3>
                <p className="max-deposit">Balance disponible: {balances.collateralBalance} cUSD</p>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Cantidad de cUSD"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={loading}
                    max={balances.collateralBalance}
                  />
                  <button 
                    onClick={deposit} 
                    disabled={loading || !isDepositAmountValid()}
                    title={depositAmount && parseFloat(depositAmount) > parseFloat(balances.collateralBalance) ? 
                      `El monto excede tu balance disponible (${balances.collateralBalance} cUSD)` : ''
                    }
                  >
                    {loading ? 'Procesando...' : 'Depositar'}
                  </button>
                </div>
                {depositAmount && parseFloat(depositAmount) > parseFloat(balances.collateralBalance) && (
                  <p className="error-message" style={{color: 'red', fontSize: '0.9em', marginTop: '5px'}}>
                    ⚠️ El monto excede tu balance disponible ({balances.collateralBalance} cUSD)
                  </p>
                )}
              </div>

              <div className="action-section">
                <h3>📈 Pedir Préstamo</h3>
                <p className="max-borrow">Máximo disponible: {getMaxBorrow().toFixed(4)} dDAI</p>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Cantidad de dDAI"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    disabled={loading}
                    max={getMaxBorrow()}
                  />
                  <button 
                    onClick={borrowFunds} 
                    disabled={loading || !isBorrowAmountValid() || getMaxBorrow() <= 0}
                    title={borrowAmount && parseFloat(borrowAmount) > getMaxBorrow() ? 
                      `El monto excede el máximo disponible (${getMaxBorrow().toFixed(4)} dDAI)` : ''
                    }
                  >
                    {loading ? 'Procesando...' : 'Pedir Préstamo'}
                  </button>
                </div>
                {borrowAmount && parseFloat(borrowAmount) > getMaxBorrow() && getMaxBorrow() > 0 && (
                  <p className="error-message" style={{color: 'red', fontSize: '0.9em', marginTop: '5px'}}>
                    ⚠️ El monto excede el máximo disponible ({getMaxBorrow().toFixed(4)} dDAI)
                  </p>
                )}
              </div>

              <div className="action-section">
                <h3>💸 Pagar Préstamo</h3>
                <p className="total-debt">
                  {parseFloat(userData.loanBalance) === 0 
                    ? 'No tienes préstamos activos' 
                    : `Total a pagar: ${getTotalToPay().toFixed(4)} dDAI`}
                </p>
                <button 
                  onClick={repayLoan} 
                  disabled={loading || parseFloat(userData.loanBalance) === 0}
                  className="repay-btn"
                >
                  {loading ? 'Procesando...' : 'Pagar Préstamo Completo'}
                </button>
              </div>

              <div className="action-section">
                <h3>🔓 Retirar Colateral</h3>
                <p className="withdraw-info">
                  {parseFloat(userData.collateralBalance) === 0 
                    ? 'No hay colateral depositado' 
                    : parseFloat(userData.loanBalance) > 0 
                    ? 'Solo disponible sin deuda activa' 
                    : `Disponible: ${userData.collateralBalance} cUSD`}
                </p>
                <button 
                  onClick={withdraw} 
                  disabled={loading || parseFloat(userData.loanBalance) > 0 || parseFloat(userData.collateralBalance) === 0}
                  className="withdraw-btn"
                >
                  {loading ? 'Procesando...' : 'Retirar Todo el Colateral'}
                </button>
              </div>
            </div>

            {/* Información del protocolo */}
            <div className="protocol-info">
              <h3>ℹ️ Información del Protocolo</h3>
              <ul>
                <li>Ratio de colateralización: 150%</li>
                <li>LTV máximo: 66%</li>
                <li>Interés fijo: 5% semanal</li>
                <li>Ratio de precios: 1 cUSD = 1 dDAI</li>
              </ul>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
