import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LENDING_ABI from './abis/lendingprotocol-abi.json';
import COLLATERAL_ABI from './abis/collateraltoken-abi.json';
import LOAN_ABI from './abis/loantoken-abi.json';
import Header from './components/Header';
import UserDashboard from './components/UserDashboard';
import ErrorAlert from './components/ErrorAlert';
import './App.css';

// Configuración desde variables de entorno
const CONTRACT_ADDRESS = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
const COLLATERAL_TOKEN_ADDRESS = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
const LOAN_TOKEN_ADDRESS = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [lendingContract, setLendingContract] = useState(null);
  const [collateralToken, setCollateralToken] = useState(null);
  const [loanToken, setLoanToken] = useState(null);
  const [userData, setUserData] = useState({
    collateral: 0,
    debt: 0,
    interest: 0,
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  // Conectar con MetaMask
  const connectWallet = async () => {
    try {
      setError('');
      if (!window.ethereum) {
        throw new Error('MetaMask no está instalado');
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      setAccount(accounts[0]);

      const lendingContract = new ethers.Contract(CONTRACT_ADDRESS, LENDING_ABI, signer);
      const collateralToken = new ethers.Contract(COLLATERAL_TOKEN_ADDRESS, COLLATERAL_ABI, signer);
      const loanToken = new ethers.Contract(LOAN_TOKEN_ADDRESS, LOAN_ABI, signer);
      setLendingContract(lendingContract);
      setCollateralToken(collateralToken);
      setLoanToken(loanToken);

      await loadUserData(accounts[0], lendingContract);

      lendingContract.on('CollateralDeposited', (user, amount) => {
        console.log(`Evento: ${user} depositó ${ethers.formatUnits(amount, 18)} cUSD`);
        if (user.toLowerCase() === accounts[0].toLowerCase()) {
          loadUserData(accounts[0], lendingContract);
        }
      });
      lendingContract.on('Borrowed', (user, amount) => {
        console.log(`Evento: ${user} pidió prestado ${ethers.formatUnits(amount, 18)} dDAI`);
        if (user.toLowerCase() === accounts[0].toLowerCase()) {
          loadUserData(accounts[0], lendingContract);
        }
      });
    } catch (error) {
      console.error('Error en connectWallet:', error);
      const errorMessage = 'Error al conectar con MetaMask: ' + (error.data?.message || error.message);
      setError(errorMessage);
      setErrorKey(prev => prev + 1);
    }
  };

  // Cargar datos del usuario
  const loadUserData = async (userAddress, contract) => {
    try {
      setError('');
      const data = await contract.getUserData(userAddress);
      setUserData({
        collateral: ethers.formatUnits(data[0], 18),
        debt: ethers.formatUnits(data[1], 18),
        interest: ethers.formatUnits(data[2], 18),
      });
    } catch (error) {
      console.error('Error en loadUserData:', error);
      const errorMessage = 'Error al cargar datos del usuario: ' + (error.data?.message || error.message);
      setError(errorMessage);
      setErrorKey(prev => prev + 1);
    }
  };

  // Depositar colateral
  const deposit = async () => {
    try {
      setError('');
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        throw new Error('Monto de depósito inválido');
      }
      const amountWei = ethers.parseUnits(depositAmount.toString(), 18);
      if (!collateralToken) {
        throw new Error('Contrato de colateral no inicializado');
      }
      const balance = await collateralToken.balanceOf(account);
      if (balance < amountWei) {
        throw new Error('Balance insuficiente de cUSD');
      }
      const approveTx = await collateralToken.approve(CONTRACT_ADDRESS, amountWei);
      await approveTx.wait();
      const depositTx = await lendingContract.depositCollateral(amountWei);
      await depositTx.wait();
      await loadUserData(account, lendingContract);
      setDepositAmount('');
    } catch (error) {
      console.error('Error en deposit:', error);
      let errorMessage = 'Error al depositar';
      if (error.message.includes('Balance insuficiente')) {
        errorMessage = 'No tienes suficiente cUSD para depositar';
      } else if (error.message.includes('Monto de depósito inválido')) {
        errorMessage = 'Ingresa un monto válido para depositar';
      } else if (error.message.includes('Contrato')) {
        errorMessage = 'Error de conexión con el contrato';
      } else if (error.data?.message) {
        errorMessage += ': ' + error.data.message;
      } else {
        errorMessage += ': ' + error.message;
      }
      setError(errorMessage);
      setErrorKey(prev => prev + 1);
    }
  };

  // Pedir prestado
  const borrow = async () => {
    try {
      setError('');
      if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
        throw new Error('Monto de préstamo inválido');
      }
      const amountWei = ethers.parseUnits(borrowAmount.toString(), 18);
      if (!loanToken || !lendingContract) {
        throw new Error('Contrato de préstamo no inicializado');
      }
      const contractBalance = await loanToken.balanceOf(CONTRACT_ADDRESS);
      if (contractBalance < amountWei) {
        throw new Error('El protocolo no tiene suficiente dDAI');
      }
      const data = await lendingContract.getUserData(account);
      const maxBorrow = (data[0] * 100n) / 150n; // Ratio 150%
      if (amountWei > maxBorrow) {
        throw new Error('El monto excede el ratio de colateralización (150%)');
      }
      const tx = await lendingContract.borrow(amountWei);
      await tx.wait();
      await loadUserData(account, lendingContract);
      setBorrowAmount('');
    } catch (error) {
      console.error('Error en borrow:', error);
      let errorMessage = 'Error al pedir prestado';
      if (error.message.includes('El protocolo no tiene suficiente dDAI')) {
        errorMessage = 'El protocolo no tiene suficiente dDAI para prestar';
      } else if (error.message.includes('ratio de colateralización')) {
        errorMessage = 'El monto solicitado excede el límite basado en tu colateral';
      } else if (error.message.includes('Monto de préstamo inválido')) {
        errorMessage = 'Ingresa un monto válido para pedir prestado';
      } else if (error.message.includes('Contrato')) {
        errorMessage = 'Error de conexión con el contrato';
      } else if (error.data?.message) {
        errorMessage += ': ' + error.data.message;
      } else {
        errorMessage += ': ' + error.message;
      }
      setError(errorMessage);
      setErrorKey(prev => prev + 1);
    }
  };

  // Pagar préstamo
  const repay = async () => {
    try {
      setError('');
      if (!lendingContract || !loanToken) {
        throw new Error('Contrato de préstamo no inicializado');
      }
      const data = await lendingContract.getUserData(account);
      const totalRepay = data[1] + data[2];
      if (totalRepay === 0n) {
        throw new Error('No hay deuda para pagar');
      }
      const balance = await loanToken.balanceOf(account);
      if (balance < totalRepay) {
        throw new Error('Balance insuficiente de dDAI para pagar');
      }
      const approveTx = await loanToken.approve(CONTRACT_ADDRESS, totalRepay);
      await approveTx.wait();
      const repayTx = await lendingContract.repay();
      await repayTx.wait();
      await loadUserData(account, lendingContract);
    } catch (error) {
      console.error('Error en repay:', error);
      let errorMessage = 'Error al pagar';
      if (error.message.includes('No hay deuda')) {
        errorMessage = 'No tienes deuda pendiente para pagar';
      } else if (error.message.includes('Balance insuficiente')) {
        errorMessage = 'No tienes suficiente dDAI para pagar';
      } else if (error.message.includes('Contrato')) {
        errorMessage = 'Error de conexión con el contrato';
      } else if (error.data?.message) {
        errorMessage += ': ' + error.data.message;
      } else {
        errorMessage += ': ' + error.message;
      }
      setError(errorMessage);
      setErrorKey(prev => prev + 1);
    }
  };

  // Retirar colateral
  const withdraw = async () => {
    try {
      setError('');
      if (!lendingContract) {
        throw new Error('Contrato de préstamo no inicializado');
      }
      const data = await lendingContract.getUserData(account);
      if (data[0] === 0n) {
        throw new Error('No hay colateral para retirar');
      }
      if (data[1] !== 0n || data[2] !== 0n) {
        throw new Error('Debes pagar tu deuda antes de retirar');
      }
      const tx = await lendingContract.withdrawCollateral();
      await tx.wait();
      await loadUserData(account, lendingContract);
    } catch (error) {
      console.error('Error en withdraw:', error);
      let errorMessage = 'Error al retirar';
      if (error.message.includes('No hay colateral')) {
        errorMessage = 'No tienes colateral para retirar';
      } else if (error.message.includes('Debes pagar')) {
        errorMessage = 'Paga tu deuda antes de retirar el colateral';
      } else if (error.message.includes('Contrato')) {
        errorMessage = 'Error de conexión con el contrato';
      } else if (error.data?.message) {
        errorMessage += ': ' + error.data.message;
      } else {
        errorMessage += ': ' + error.message;
      }
      setError(errorMessage);
      setErrorKey(prev => prev + 1);
    }
  };

  // Actualizar datos al cambiar cuenta
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (lendingContract) {
            await loadUserData(accounts[0], lendingContract);
          }
        } else {
          setAccount(null);
          setUserData({ collateral: 0, debt: 0, interest: 0 });
          setError('');
          setErrorKey(prev => prev + 1);
          setDepositAmount('');
          setBorrowAmount('');
        }
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, [lendingContract]);

  return (
    <div className="app-container">
      <Header account={account} connectWallet={connectWallet} />
      {account && (
        <UserDashboard
          userData={userData}
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          borrowAmount={borrowAmount}
          setBorrowAmount={setBorrowAmount}
          deposit={deposit}
          borrow={borrow}
          repay={repay}
          withdraw={withdraw}
        />
      )}
      <ErrorAlert key={errorKey} error={error} onClose={() => setError('')} />
    </div>
  );
}

export default App;