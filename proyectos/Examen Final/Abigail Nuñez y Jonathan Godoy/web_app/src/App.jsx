import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, ethers } from 'ethers';
import lendingArtifact from './contracts/lending-abi.json';

// ABI para interactuar con el contrato de préstamo
const lendingAbi = lendingArtifact.abi;

// Main application component for interacting with the lending protocol

// Funcionalidad principal:
// 1. Conexión de la billetera mediante MetaMask
// 2. Inicialización de contratos y gestión de estados
// 3. Seguimiento de la posición del usuario(garantía, deuda, intereses)
// 4. Interacción con el protocolo(depósito, préstamo, reembolso, retiro)
// 5. Cálculos financieros en tiempo real(factor de salud, máximo préstamo)
// 6. Gestión de transacciones con comentarios de los usuarios          *
// Características de seguridad:
// - Validación de entrada para todas las operaciones
// - Verificación de saldo antes de las transacciones
// - Flujo de trabajo de aprobación ERC20
// - Gestión de errores con comentarios de los usuarios
// - Especificaciones del límite de gas
function App() {
  // Gestión de estados
  const [account, setAccount] = useState(''); // Dirección de billetera conectada
  const [contract, setContract] = useState(null); // Instancia de contrato de protocolo de préstamo
  const [cUSDContract, setCUSDContract] = useState(null); // Contrato de token colateral
  const [dDAIContract, setDDAIContract] = useState(null); // Contrato de token de préstamo
  const [collateral, setCollateral] = useState('0'); // Importe de la garantía del usuario
  const [debt, setDebt] = useState('0'); // Deuda pendiente del usuario
  const [interest, setInterest] = useState('0'); // Intereses devengados
  const [loading, setLoading] = useState(false); // Transacción en curso
  const [error, setError] = useState(''); // Mensaje de error
  const [success, setSuccess] = useState(''); // Mensaje de éxito
  const [balances, setBalances] = useState({ cUSD: '0', dDAI: '0' }); // Saldos de tokens de billetera

  // Variables de entorno del archivo .env
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_RPC_URL;

  // Effect hook to load user data when contracts and account are ready

  // Se activa cuando:
  // - La cuenta del usuario está conectada
  // - Se inicializan las instancias del contrato
  // Carga:
  // 1. Posición de garantía / deuda del usuario
  // 2. Saldos de tokens del monedero
  useEffect(() => {
    if (account && contract && cUSDContract && dDAIContract) {
      loadUserData();
      loadBalances();
    }
  }, [account, contract, cUSDContract, dDAIContract]);

  // Effect hook to clear messages after timeout
  // Borra automáticamente los mensajes de éxito/error después de 5 segundos para mantener una interfaz de usuario limpia
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Connects user's MetaMask wallet

  // Flujo de trabajo:
  // 1. Verifica la disponibilidad de MetaMask
  // 2. Solicita acceso a la cuenta
  // 3. Activa la cuenta
  // 4. Proporciona comentarios a los usuarios
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setAccount(accounts[0]);
      setSuccess("Wallet connected successfully!");
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initializes contract instances after wallet connection

  // Flujo de trabajo:
  // 1. Crea el proveedor y el firmante
  // 2. Crea una instancia del contrato de préstamo
  // 3. Obtiene las direcciones de los tokens del contrato de préstamo
  // 4. Crea instancias de contrato ERC20 para los tokens
  const setupContracts = async () => {
    try {
      setLoading(true);
      console.log("Setting up contracts...");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const lendingContract = new Contract(contractAddress, lendingAbi, signer);
      setContract(lendingContract);

      const cUSDAddress = await lendingContract.collateralToken();
      const dDAIAddress = await lendingContract.loanToken();

      console.log("Token addresses - cUSD:", cUSDAddress, "dDAI:", dDAIAddress);

      const erc20Abi = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)"
      ];

      // Crear contratos de tokens
      const cUSD = new Contract(cUSDAddress, erc20Abi, signer);
      const dDAI = new Contract(dDAIAddress, erc20Abi, signer);

      setCUSDContract(cUSD);
      setDDAIContract(dDAI);

      setSuccess("Contracts initialized successfully!");
      console.log("Contracts setup complete");

    } catch (error) {
      console.error("Contract setup failed:", error);
      setError("Failed to initialize contracts. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Loads user's lending position data

  // Obtiene:
  // - Importe de la garantía(cUSD)
  // - Deuda actual(dDAI)
  // - Intereses devengados(dDAI)
  // Se solicita automáticamente tras la inicialización del contrato y las transacciones.
  const loadUserData = async () => {
    if (!contract || !account) return;

    try {
      const [collateralAmount, currentDebt, interestAccrued] = await contract.getUserData(account);
      setCollateral(ethers.formatUnits(collateralAmount, 18));
      setDebt(ethers.formatUnits(currentDebt, 18));
      setInterest(ethers.formatUnits(interestAccrued, 18));
    } catch (error) {
      console.error("Error loading user data:", error);
      setError("Failed to load user data");
    }
  };

  // Loads user's wallet token balances

  // Obtiene:
  // - Saldo de cUSD
  // - Saldo de dDAI 
  // Se llama automáticamente después de la inicialización del contrato y las transacciones.
  const loadBalances = async () => {
    if (!cUSDContract || !dDAIContract || !account) return;

    try {
      const cUSDBalance = await cUSDContract.balanceOf(account);
      const dDAIBalance = await dDAIContract.balanceOf(account);

      setBalances({
        cUSD: ethers.formatUnits(cUSDBalance, 18),
        dDAI: ethers.formatUnits(dDAIBalance, 18)
      });
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  // Handles ERC20 token approval workflow

  // Flujo de trabajo:
  // 1. Verifica la asignación existente
  // 2. Solo solicita aprobación si es necesario
  // 3. Gestiona la transacción de aprobación
  // Función de seguridad:
  // - Evita transacciones de aprobación innecesarias
  // - Esencial para operaciones de depósito y reembolso
  const approveTokens = async (tokenContract, amount) => {
    try {
      const requiredAllowance = ethers.parseUnits(amount, 18);

      const currentAllowance = await tokenContract.allowance(account, contractAddress);

      if (currentAllowance >= requiredAllowance) {
        console.log("Sufficient allowance already exists");
        return;
      }

      console.log("Approving tokens...");
      const tx = await tokenContract.approve(contractAddress, requiredAllowance, { gasLimit: 100000 });
      await tx.wait();
      console.log("Token approval successful");
    } catch (error) {
      console.error("Approval failed:", error);
      throw error;
    }
  };

  // Deposits collateral into the protocol

  // Flujo de trabajo:
  // 1. Solicitar al usuario el importe
  // 2. Validar la entrada y el saldo
  // 3. Aprobar la transferencia de tokens
  // 4. Ejecutar la transacción de depósito
  // 5. Actualizar el estado de la interfaz de usuario
  const depositCollateral = async () => {
    if (!contract || !cUSDContract) {
      setError("Contracts not initialized");
      return;
    }

    const amount = prompt("Enter cUSD amount to deposit:");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const balance = await cUSDContract.balanceOf(account);
      const requiredAmount = ethers.parseUnits(amount, 18);

      if (balance < requiredAmount) {
        setError("Insufficient cUSD balance");
        return;
      }

      await approveTokens(cUSDContract, amount);

      console.log("Depositing collateral...");
      const tx = await contract.depositCollateral(requiredAmount, { gasLimit: 200000 });
      await tx.wait();

      setSuccess(`Successfully deposited ${amount} cUSD as collateral!`);
      await loadUserData();
      await loadBalances();

    } catch (error) {
      console.error("Deposit failed:", error);
      setError("Deposit failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Borrows loan against collateral

  // Flujo de trabajo:
  // 1. Solicitar al usuario el importe
  // 2. Validar con el ratio de colateralización
  // 3. Verificar la liquidez del protocolo
  // 4. Ejecutar la transacción de préstamo
  // 5. Actualizar el estado de la interfaz de usuario
  const borrowLoan = async () => {
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    const amount = prompt("Enter dDAI amount to borrow:");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const collateralAmount = ethers.parseUnits(collateral, 18);
      const maxBorrow = (collateralAmount * 100n) / 150n; // 66.67% de collateral
      const requestedAmount = ethers.parseUnits(amount, 18);

      if (requestedAmount > maxBorrow) {
        const maxBorrowFormatted = ethers.formatUnits(maxBorrow, 18);
        setError(`Amount exceeds maximum borrowable: ${maxBorrowFormatted} dDAI`);
        return;
      }

      console.log("Borrowing loan...");
      const tx = await contract.borrow(requestedAmount, { gasLimit: 200000 });
      await tx.wait();

      setSuccess(`Successfully borrowed ${amount} dDAI!`);
      await loadUserData();
      await loadBalances();

    } catch (error) {
      console.error("Borrow failed:", error);
      setError("Borrow failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Repays outstanding loan

  // Flujo de trabajo:
  // 1. Verifica la deuda existente
  // 2. Calcula la deuda actual más los intereses
  // 3. Valida el saldo del usuario
  // 4. Aprueba la transferencia de tokens
  // 5. Ejecuta la transacción de reembolso
  // 6. Actualiza el estado de la interfaz de usuario
  const repayLoan = async () => {
    if (!contract || !dDAIContract) {
      setError("Contracts not initialized");
      return;
    }

    if (parseFloat(debt) === 0) {
      setError("No debt to repay");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const currentDebt = await contract.getCurrentDebt(account);
      const debtAmount = ethers.formatUnits(currentDebt, 18);

      const balance = await dDAIContract.balanceOf(account);
      if (balance < currentDebt) {
        setError(`Insufficient dDAI balance. Need ${debtAmount} dDAI`);
        return;
      }

      await approveTokens(dDAIContract, debtAmount);

      console.log("Repaying loan...");
      const tx = await contract.repay({ gasLimit: 200000 });
      await tx.wait();

      setSuccess(`Successfully repaid ${debtAmount} dDAI!`);
      await loadUserData();
      await loadBalances();

    } catch (error) {
      console.error("Repay failed:", error);
      setError("Repay failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Withdraws collateral after debt repayment

  // Flujo de trabajo:
  // 1. Verifica que no haya deudas pendientes
  // 2. Confirma la garantía disponible
  // 3. Ejecuta la transacción de retiro
  // 4. Actualiza el estado de la interfaz de usuario
  const withdrawCollateral = async () => {
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    if (parseFloat(debt) > 0) {
      setError("Cannot withdraw collateral while you have outstanding debt");
      return;
    }

    if (parseFloat(collateral) === 0) {
      setError("No collateral to withdraw");
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log("Withdrawing collateral...");
      const tx = await contract.withdrawCollateral({ gasLimit: 200000 });
      await tx.wait();

      setSuccess(`Successfully withdrew ${collateral} cUSD collateral!`);
      await loadUserData();
      await loadBalances();

    } catch (error) {
      console.error("Withdraw failed:", error);
      setError("Withdraw failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Asistente de interfaz de usuario: Formatea números para su visualización
  // num: Número a formatear
  // retorna cadena formateada con 4 decimales
  const formatNumber = (num) => {
    return parseFloat(num).toFixed(4);
  };

  // Calculates maximum borrowable amount
  // Fórmula:
  // maxBorrow = (collateral * 100) / 150 - currentDebt
  // retorna monto máximo prestable en dDAI
  const calculateMaxBorrow = () => {
    const collateralValue = parseFloat(collateral);
    const currentDebtValue = parseFloat(debt);
    const maxTotal = (collateralValue * 100) / 150; // 66.67% de collateral
    const available = Math.max(0, maxTotal - currentDebtValue);
    return available.toFixed(4);
  };

  // Calculates position health factor
  // Fórmula:
  // healthFactor = (collateral * 100) / (debt * 150)
  // Interpretación:
  // - > 100: Seguro
  // - 100: En el umbral de liquidación
  // - <100: Infracolateralizado
  const calculateHealthFactor = () => {
    const collateralValue = parseFloat(collateral);
    const debtValue = parseFloat(debt);
    if (debtValue === 0) return "∞";
    const healthFactor = (collateralValue * 100) / (debtValue * 150);
    return healthFactor.toFixed(2);
  };

  // Representar componentes de la interfaz de usuario
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#ffffff' }}>🏦 DeFi Lending Protocol</h1>

      {/* Status Messages */}
      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#e8f5e8',
          color: '#2e7d32',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #4caf50'
        }}>
          ✅ {success}
        </div>
      )}

      {loading && (
        <div style={{
          background: '#fff3e0',
          color: '#ef6c00',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ff9800'
        }}>
          ⏳ Processing transaction...
        </div>
      )}

      {!account ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <button
            onClick={connectWallet}
            disabled={loading}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Connecting...' : '🔗 Connect Wallet'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            background: '#8b00ff',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>📱 Connected Account</h3>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
              {account}
            </p>
          </div>

          {!contract && (
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button
                onClick={setupContracts}
                disabled={loading}
                style={{
                  padding: '12px 25px',
                  fontSize: '16px',
                  backgroundColor: '#388e3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Initializing...' : '⚙️ Initialize Contracts'}
              </button>
            </div>
          )}

          {contract && (
            <div>
              {/* Wallet Balances */}
              <div style={{
                background: '#5caf36',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0' }}>💰 Wallet Balances</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>cUSD:</strong> {formatNumber(balances.cUSD)}
                  </div>
                  <div>
                    <strong>dDAI:</strong> {formatNumber(balances.dDAI)}
                  </div>
                </div>
              </div>

              {/* Your Position */}
              <div style={{
                background: '#ff83fb',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '25px'
              }}>
                <h2 style={{ margin: '0 0 20px 0' }}>📊 Your Position</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <strong>Collateral:</strong><br />
                    <span style={{ fontSize: '18px', color: '#1976d2' }}>
                      {formatNumber(collateral)} cUSD
                    </span>
                  </div>
                  <div>
                    <strong>Debt:</strong><br />
                    <span style={{ fontSize: '18px', color: '#d32f2f' }}>
                      {formatNumber(debt)} dDAI
                    </span>
                  </div>
                  <div>
                    <strong>Interest Accrued:</strong><br />
                    <span style={{ fontSize: '18px', color: '#f57c00' }}>
                      {formatNumber(interest)} dDAI
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong>Max Borrowable:</strong><br />
                      <span style={{ fontSize: '16px', color: '#388e3c' }}>
                        {calculateMaxBorrow()} dDAI
                      </span>
                    </div>
                    <div>
                      <strong>Health Factor:</strong><br />
                      <span style={{
                        fontSize: '16px',
                        color: parseFloat(calculateHealthFactor()) > 1.2 ? '#388e3c' : '#d32f2f'
                      }}>
                        {calculateHealthFactor()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={depositCollateral}
                  disabled={loading}
                  style={{
                    padding: '15px',
                    fontSize: '16px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  💰 Deposit Collateral
                </button>

                <button
                  onClick={borrowLoan}
                  disabled={loading || parseFloat(collateral) === 0}
                  style={{
                    padding: '15px',
                    fontSize: '16px',
                    backgroundColor: '#388e3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (loading || parseFloat(collateral) === 0) ? 'not-allowed' : 'pointer',
                    opacity: (loading || parseFloat(collateral) === 0) ? 0.6 : 1
                  }}
                >
                  📈 Borrow Loan
                </button>

                <button
                  onClick={repayLoan}
                  disabled={loading || parseFloat(debt) === 0}
                  style={{
                    padding: '15px',
                    fontSize: '16px',
                    backgroundColor: '#f57c00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (loading || parseFloat(debt) === 0) ? 'not-allowed' : 'pointer',
                    opacity: (loading || parseFloat(debt) === 0) ? 0.6 : 1
                  }}
                >
                  💳 Repay Loan
                </button>

                <button
                  onClick={withdrawCollateral}
                  disabled={loading || parseFloat(debt) > 0 || parseFloat(collateral) === 0}
                  style={{
                    padding: '15px',
                    fontSize: '16px',
                    backgroundColor: '#7b1fa2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (loading || parseFloat(debt) > 0 || parseFloat(collateral) === 0) ? 'not-allowed' : 'pointer',
                    opacity: (loading || parseFloat(debt) > 0 || parseFloat(collateral) === 0) ? 0.6 : 1
                  }}
                >
                  🏦 Withdraw Collateral
                </button>
              </div>

              {/* Protocol Information */}
              <div style={{
                background: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ Protocol Information</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Collateralization Ratio: 150% (you can borrow up to 66.67% of your collateral)</li>
                  <li>Interest Rate: 5% per week (simple interest, not compounded)</li>
                  <li>Exchange Rate: 1 cUSD = 1 dDAI (fixed)</li>
                  <li>Health Factor &gt; 1.0 means your position is safe</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;