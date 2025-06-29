import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ABIs de los contratos (simplificados)
const LENDING_PROTOCOL_ABI = [
  'function depositCollateral(uint256 amount) external',
  'function borrow(uint256 amount) external',
  'function repay() external',
  'function withdrawCollateral() external',
  'function getUserData(address user) external view returns (uint256 collateral, uint256 loan, uint256 interest)',
  'event CollateralDeposited(address indexed user, uint256 amount)',
  'event LoanTaken(address indexed user, uint256 amount)',
  'event LoanRepaid(address indexed user, uint256 amount, uint256 interest)',
  'event CollateralWithdrawn(address indexed user, uint256 amount)',
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

// Direcciones de los contratos (se configurarán desde variables de entorno)
const CONTRACTS = {
  LENDING_PROTOCOL: import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS || '',
  COLLATERAL_TOKEN: import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS || '',
  LOAN_TOKEN: import.meta.env.VITE_LOAN_TOKEN_ADDRESS || '',
  RPC_URL:
    import.meta.env.VITE_RPC_URL ||
    'https://ethereum-sepolia-rpc.publicnode.com',
};

function App() {
  // Estados de la aplicación
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [userData, setUserData] = useState({
    collateral: '0',
    loan: '0',
    interest: '0',
  });
  const [balances, setBalances] = useState({
    collateral: '0',
    loan: '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');

  // Conectar wallet
  const connectWallet = async () => {
    try {
      setError('');
      setLoading(true);

      if (!window.ethereum) {
        throw new Error('MetaMask no está instalado');
      }

      // Solicitar conexión a MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No se seleccionó ninguna cuenta');
      }

      // Configurar provider y signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);

      // Inicializar contratos
      await initializeContracts(web3Signer);

      setSuccess('Wallet conectado exitosamente');
    } catch (err) {
      console.error('Error conectando wallet:', err);
      setError(err.message || 'Error conectando wallet');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar contratos
  const initializeContracts = async signer => {
    try {
      if (
        !CONTRACTS.LENDING_PROTOCOL ||
        !CONTRACTS.COLLATERAL_TOKEN ||
        !CONTRACTS.LOAN_TOKEN
      ) {
        throw new Error('Direcciones de contratos no configuradas');
      }

      const lendingProtocol = new ethers.Contract(
        CONTRACTS.LENDING_PROTOCOL,
        LENDING_PROTOCOL_ABI,
        signer
      );
      const collateralToken = new ethers.Contract(
        CONTRACTS.COLLATERAL_TOKEN,
        ERC20_ABI,
        signer
      );
      const loanToken = new ethers.Contract(
        CONTRACTS.LOAN_TOKEN,
        ERC20_ABI,
        signer
      );

      setContracts({
        lendingProtocol,
        collateralToken,
        loanToken,
      });

      return { lendingProtocol, collateralToken, loanToken };
    } catch (err) {
      console.error('Error inicializando contratos:', err);
      throw err;
    }
  };

  // Cargar datos del usuario
  const loadUserData = async () => {
    try {
      if (!account || !contracts.lendingProtocol) return;

      setLoading(true);

      // Obtener datos del protocolo
      const [collateral, loan, interest] =
        await contracts.lendingProtocol.getUserData(account);

      setUserData({
        collateral: ethers.formatEther(collateral),
        loan: ethers.formatEther(loan),
        interest: ethers.formatEther(interest),
      });

      // Obtener balances de tokens
      const collateralBalance = await contracts.collateralToken.balanceOf(
        account
      );
      const loanBalance = await contracts.loanToken.balanceOf(account);

      setBalances({
        collateral: ethers.formatEther(collateralBalance),
        loan: ethers.formatEther(loanBalance),
      });
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Depositar colateral
  const deposit = async () => {
    try {
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        throw new Error('Ingrese una cantidad válida');
      }

      setError('');
      setLoading(true);

      const amount = ethers.parseEther(depositAmount);

      // Aprobar tokens
      console.log('Aprobando tokens...');
      const approveTx = await contracts.collateralToken.approve(
        CONTRACTS.LENDING_PROTOCOL,
        amount
      );
      await approveTx.wait();

      // Depositar colateral
      console.log('Depositando colateral...');
      const depositTx = await contracts.lendingProtocol.depositCollateral(
        amount
      );
      await depositTx.wait();

      setSuccess(`Depositados ${depositAmount} cUSD como colateral`);
      setDepositAmount('');
      await loadUserData();
    } catch (err) {
      console.error('Error depositando:', err);
      setError(err.message || 'Error depositando colateral');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar préstamo
  const borrow = async () => {
    try {
      if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
        throw new Error('Ingrese una cantidad válida');
      }

      setError('');
      setLoading(true);

      const amount = ethers.parseEther(borrowAmount);

      console.log('Solicitando préstamo...');
      const borrowTx = await contracts.lendingProtocol.borrow(amount);
      await borrowTx.wait();

      setSuccess(`Préstamo de ${borrowAmount} dDAI obtenido`);
      setBorrowAmount('');
      await loadUserData();
    } catch (err) {
      console.error('Error solicitando préstamo:', err);
      setError(err.message || 'Error solicitando préstamo');
    } finally {
      setLoading(false);
    }
  };

  // Repagar préstamo
  const repay = async () => {
    try {
      setError('');
      setLoading(true);

      const totalDebt = ethers.parseEther(
        (parseFloat(userData.loan) + parseFloat(userData.interest)).toString()
      );

      if (totalDebt.eq(0)) {
        throw new Error('No hay deuda para pagar');
      }

      // Aprobar tokens
      console.log('Aprobando tokens para repago...');
      const approveTx = await contracts.loanToken.approve(
        CONTRACTS.LENDING_PROTOCOL,
        totalDebt
      );
      await approveTx.wait();

      // Repagar préstamo
      console.log('Pagando préstamo...');
      const repayTx = await contracts.lendingProtocol.repay();
      await repayTx.wait();

      setSuccess('Préstamo pagado exitosamente');
      await loadUserData();
    } catch (err) {
      console.error('Error pagando préstamo:', err);
      setError(err.message || 'Error pagando préstamo');
    } finally {
      setLoading(false);
    }
  };

  // Retirar colateral
  const withdraw = async () => {
    try {
      setError('');
      setLoading(true);

      if (parseFloat(userData.collateral) === 0) {
        throw new Error('No hay colateral para retirar');
      }

      if (parseFloat(userData.loan) > 0 || parseFloat(userData.interest) > 0) {
        throw new Error('Debe pagar toda la deuda antes de retirar');
      }

      console.log('Retirando colateral...');
      const withdrawTx = await contracts.lendingProtocol.withdrawCollateral();
      await withdrawTx.wait();

      setSuccess('Colateral retirado exitosamente');
      await loadUserData();
    } catch (err) {
      console.error('Error retirando colateral:', err);
      setError(err.message || 'Error retirando colateral');
    } finally {
      setLoading(false);
    }
  };

  // Calcular máximo préstamo disponible
  const maxBorrowAmount = () => {
    const collateralValue = parseFloat(userData.collateral);
    return ((collateralValue * 100) / 150).toFixed(4); // 66.67% del colateral
  };

  // Calcular ratio de colateralización actual
  const currentRatio = () => {
    const collateralValue = parseFloat(userData.collateral);
    const debtValue = parseFloat(userData.loan) + parseFloat(userData.interest);

    if (debtValue === 0) return 'N/A';
    return ((collateralValue / debtValue) * 100).toFixed(2) + '%';
  };

  // Efectos
  useEffect(() => {
    if (account && contracts.lendingProtocol) {
      loadUserData();
    }
  }, [account, contracts.lendingProtocol]);

  // Manejar cambios de cuenta
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', accounts => {
        if (accounts.length === 0) {
          setAccount('');
          setProvider(null);
          setSigner(null);
          setContracts({});
        } else {
          setAccount(accounts[0]);
          if (provider) {
            loadUserData();
          }
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [provider]);

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>🏦 DeFi Lending Protocol</h1>
          <p>Protocolo de préstamos descentralizados con colateral</p>
        </div>

        {/* Conexión de Wallet */}
        <div className="wallet-section">
          {!account ? (
            <button
              className="connect-btn"
              onClick={connectWallet}
              disabled={loading}
            >
              {loading ? 'Conectando...' : 'Conectar MetaMask'}
            </button>
          ) : (
            <div className="wallet-info">
              <h3>✅ Wallet Conectado</h3>
              <div className="wallet-address">{account}</div>
              <p>Red: Sepolia Testnet</p>
            </div>
          )}
        </div>

        {/* Mensajes de estado */}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {account && (
          <>
            {/* Datos del usuario */}
            <div className="user-data">
              <div className="data-card">
                <h3>Colateral Depositado</h3>
                <div className="value collateral">{userData.collateral}</div>
                <div className="label">cUSD</div>
              </div>
              <div className="data-card">
                <h3>Préstamo Activo</h3>
                <div className="value loan">{userData.loan}</div>
                <div className="label">dDAI</div>
              </div>
              <div className="data-card">
                <h3>Interés Acumulado</h3>
                <div className="value interest">{userData.interest}</div>
                <div className="label">dDAI</div>
              </div>
            </div>

            {/* Balances de tokens */}
            <div className="user-data">
              <div className="data-card">
                <h3>Balance cUSD</h3>
                <div className="value">{balances.collateral}</div>
                <div className="label">Disponible</div>
              </div>
              <div className="data-card">
                <h3>Balance dDAI</h3>
                <div className="value">{balances.loan}</div>
                <div className="label">Disponible</div>
              </div>
              <div className="data-card">
                <h3>Ratio Colateralización</h3>
                <div className="value">{currentRatio()}</div>
                <div className="label">Actual</div>
              </div>
            </div>

            {/* Acciones */}
            <div className="actions">
              {/* Depositar Colateral */}
              <div className="action-card">
                <h3>💰 Depositar Colateral</h3>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Cantidad cUSD"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button
                  className="action-btn success"
                  onClick={deposit}
                  disabled={loading || !depositAmount}
                >
                  Depositar
                </button>
              </div>

              {/* Solicitar Préstamo */}
              <div className="action-card">
                <h3>📈 Solicitar Préstamo</h3>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Cantidad dDAI"
                    value={borrowAmount}
                    onChange={e => setBorrowAmount(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <p
                  style={{ fontSize: '0.8rem', color: '#666', margin: '5px 0' }}
                >
                  Máximo: {maxBorrowAmount()} dDAI
                </p>
                <button
                  className="action-btn"
                  onClick={borrow}
                  disabled={
                    loading ||
                    !borrowAmount ||
                    parseFloat(userData.collateral) === 0
                  }
                >
                  Pedir Prestado
                </button>
              </div>

              {/* Repagar Préstamo */}
              <div className="action-card">
                <h3>💳 Repagar Préstamo</h3>
                <p style={{ fontSize: '0.9rem', margin: '10px 0' }}>
                  Total a pagar:{' '}
                  {(
                    parseFloat(userData.loan) + parseFloat(userData.interest)
                  ).toFixed(6)}{' '}
                  dDAI
                </p>
                <button
                  className="action-btn warning"
                  onClick={repay}
                  disabled={loading || parseFloat(userData.loan) === 0}
                >
                  Pagar Completo
                </button>
              </div>

              {/* Retirar Colateral */}
              <div className="action-card">
                <h3>🏧 Retirar Colateral</h3>
                <p style={{ fontSize: '0.9rem', margin: '10px 0' }}>
                  Disponible: {userData.collateral} cUSD
                </p>
                <button
                  className="action-btn danger"
                  onClick={withdraw}
                  disabled={
                    loading ||
                    parseFloat(userData.collateral) === 0 ||
                    parseFloat(userData.loan) > 0
                  }
                >
                  Retirar Todo
                </button>
              </div>
            </div>

            {/* Información del protocolo */}
            <div className="ratios">
              <h3>📊 Información del Protocolo</h3>
              <ul>
                <li>
                  <span>Ratio de Colateralización:</span>
                  <strong>150%</strong>
                </li>
                <li>
                  <span>Ratio de Préstamo:</span>
                  <strong>66.67%</strong>
                </li>
                <li>
                  <span>Tasa de Interés:</span>
                  <strong>5% semanal</strong>
                </li>
                <li>
                  <span>Tipo de Cambio:</span>
                  <strong>1 cUSD = 1 dDAI</strong>
                </li>
              </ul>
            </div>

            {/* Botón de actualizar */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className="action-btn"
                onClick={loadUserData}
                disabled={loading}
                style={{ maxWidth: '200px' }}
              >
                {loading ? 'Cargando...' : '🔄 Actualizar Datos'}
              </button>
            </div>
          </>
        )}

        {!account && (
          <div className="info">
            <h3>🚀 Cómo usar el protocolo:</h3>
            <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Conecta tu wallet MetaMask</li>
              <li>Asegúrate de estar en Sepolia Testnet</li>
              <li>Deposita tokens cUSD como colateral</li>
              <li>Solicita préstamos en dDAI (máximo 66.67% del colateral)</li>
              <li>Paga tu préstamo con interés del 5% semanal</li>
              <li>Retira tu colateral una vez pagada la deuda</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
