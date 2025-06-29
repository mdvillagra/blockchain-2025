import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import contractABI from "./contractABI.json";
import deployedAddresses from "./deployed-addresses.json";

import {
  FiLogIn,
  FiRefreshCw,
  FiDownload,
  FiCreditCard,
  FiDollarSign,
  FiUpload,
  FiDroplet,
  FiZap,
  FiRepeat,
  FiUser,
  FiBarChart2,
  FiTool,
  FiCpu,
  FiPieChart
} from "react-icons/fi";

const contractAddress = deployedAddresses.lendingProtocol;
const rpcURL = "https://alfajores-forno.celo-testnet.org";

const collateralTokenAddress = deployedAddresses.collateralToken;
const loanTokenAddress = deployedAddresses.loanToken;

const erc20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];


function App() {
  const [account, setAccount] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [userData, setUserData] = useState({ collateral: 0, debt: 0, interest: 0 });
  const [balanceCUSD, setBalanceCUSD] = useState("0");
  const [balanceDDAI, setBalanceDDAI] = useState("0");
  const [collateralToken, setCollateralTokenContract] = useState(null);
  const [loanToken, setLoanTokenContract] = useState(null);

  useEffect(() => {
    const initializeContracts = async () => {
      if (window.ethereum && account) {
        try {
          console.log("Contract addresses:", {
            contractAddress,
            collateralTokenAddress,
            loanTokenAddress
          });
          
          // Validar que todas las direcciones estén definidas
          if (!contractAddress) {
            throw new Error("VITE_CONTRACT_ADDRESS no está definida en las variables de entorno");
          }
          if (!collateralTokenAddress) {
            throw new Error("collateralTokenAddress no está definida");
          }
          if (!loanTokenAddress) {
            throw new Error("loanTokenAddress no está definida");
          }

          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          console.log("Creating contracts with signer:", signer);
          
          const collateralToken = new ethers.Contract(collateralTokenAddress, erc20ABI, signer);
          const loanToken = new ethers.Contract(loanTokenAddress, erc20ABI, signer);
          const lendingContract = new ethers.Contract(contractAddress, contractABI, signer);
          
          setProtocol(lendingContract);
          setCollateralTokenContract(collateralToken);
          setLoanTokenContract(loanToken);
          
          console.log("Contracts initialized successfully");
        } catch (error) {
          console.error("Error initializing contracts:", error);
        }
      }
    };

    initializeContracts();
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } else {
      alert("MetaMask no detectado");
    }
  };

  const loadUserData = async () => {
    if (protocol && account) {
      const [collateral, debt, interest] = await protocol.getUserData(account);
      setUserData({
        collateral: ethers.formatEther(collateral),
        debt: ethers.formatEther(debt),
        interest: ethers.formatEther(interest)
      });
    }
  };

  const deposit = async () => {
    try {
      const amount = prompt("¿Cuánto cUSD querés depositar?");
      if (!amount || amount <= 0) {
        alert("Cantidad inválida");
        return;
      }
      
      const weiAmount = ethers.parseEther(amount);
      
      console.log("Deposit amount:", amount, "wei:", weiAmount.toString());
      
      // Verificar balance del usuario
      const userBalance = await collateralToken.balanceOf(account);
      console.log("User balance:", ethers.formatEther(userBalance));
      
      if (userBalance < weiAmount) {
        alert(`No tenés suficientes cUSD. Balance: ${ethers.formatEther(userBalance)} cUSD`);
        return;
      }
      
      // Verificar allowance
      const allowance = await collateralToken.allowance(account, contractAddress);
      console.log("Current allowance:", ethers.formatEther(allowance));
      
      if (allowance < weiAmount) {
        console.log("Approving tokens...");
        // 1. Aprobar al contrato principal para mover cUSD
        const approveTx = await collateralToken.approve(contractAddress, weiAmount);
        await approveTx.wait();
        console.log("Approval successful");
      }

      // 2. Llamar a depositCollateral en el contrato principal
      console.log("Calling depositCollateral...");
      const depositTx = await protocol.depositCollateral(weiAmount);
      await depositTx.wait();
      console.log("Deposit successful");

      alert("Depósito exitoso");
      
      // Recargar datos del usuario
      await loadUserData();
      await loadBalances();
      
    } catch (error) {
      console.error("Error in deposit:", error);
      alert(`Error en el depósito: ${error.message}`);
    }
  };

  const borrow = async () => {
    // 1. Obtener la posición del usuario
    const [collateral, debt, interest] = await protocol.getUserData(account);

    // 2. Calcular el máximo prestable (66% del colateral)
    const maxBorrow = collateral * 66n / 100n;

    const amount = prompt(`¿Cuánto dDAI querés pedir prestado? (máximo: ${ethers.formatEther(maxBorrow)} dDAI)`);
    const weiAmount = ethers.parseEther(amount);

    // 3. Validar límite de colateralización
    if (weiAmount > maxBorrow) {
      alert("Supera el límite permitido por tu colateral");
      return;
    }

    // 4. Ejecutar la función borrow()
    const tx = await protocol.borrow(weiAmount);
    await tx.wait();

    alert("Préstamo exitoso");
  };


  const repay = async () => {
    // 1. Obtener deuda actual e interés
    const [_, debt, interest] = await protocol.getUserData(account);
    const total = debt + interest;

    // 2. Aprobar el uso de dDAI
    const approveTx = await loanToken.approve(contractAddress, total);
    await approveTx.wait();

    // 3. Ejecutar repay()
    const repayTx = await protocol.repay();
    await repayTx.wait();

    alert("Pago realizado con éxito");
  };

  const withdraw = async () => {
    await protocol.withdrawCollateral();
  };

  const mintCollateral = async () => {
    try {
      const amount = prompt("¿Cuánto cUSD querés mintear?");
      if (!amount || amount <= 0) {
        alert("Cantidad inválida");
        return;
      }
      
      const weiAmount = ethers.parseEther(amount);
      console.log("Minting", amount, "cUSD to", account);

      const tx = await collateralToken.mint(account, weiAmount);
      await tx.wait();

      alert(`Se mintaron ${amount} cUSD a tu cuenta`);
      
      // Recargar balances
      await loadBalances();
      
    } catch (error) {
      console.error("Error minting collateral:", error);
      alert(`Error mintando cUSD: ${error.message}`);
    }
  };

  const mintLoanToken = async () => {
    try {
      const amount = prompt("¿Cuánto dDAI querés mintear?");
      if (!amount || amount <= 0) {
        alert("Cantidad inválida");
        return;
      }
      
      const weiAmount = ethers.parseEther(amount);
      console.log("Minting", amount, "dDAI to", account);

      const tx = await loanToken.mint(account, weiAmount);
      await tx.wait();

      alert(`Se mintaron ${amount} dDAI a tu cuenta`);
      
      // Recargar balances
      await loadBalances();
      
    } catch (error) {
      console.error("Error minting loan token:", error);
      alert(`Error mintando dDAI: ${error.message}`);
    }
  };

  const loadBalances = async () => {
    if (!account) return;

    const cBal = await collateralToken.balanceOf(account);
    const dBal = await loanToken.balanceOf(account);

    setBalanceCUSD(ethers.formatEther(cBal));
    setBalanceDDAI(ethers.formatEther(dBal));
  };

  return (
    <div>
      {!account ? (
        <div id="wallet-landing">
          <div className="logo-icon">
            <FiLogIn />
          </div>
          <h1>Lending DApp</h1>
          <button onClick={connectWallet}>
            <FiLogIn /> Conectar Wallet
          </button>
        </div>
      ) : (
        <>
          <h1>Lending DApp</h1>
  
          <section className="account-info">
            <h2><FiUser /> Información de la Cuenta</h2>
            <p><strong>Cuenta:</strong> {account}</p>
            <button onClick={loadUserData}>
              <FiRefreshCw /> Cargar Datos
            </button>
          </section>
  
          <section className="balances">
            <h2><FiBarChart2 /> Estado del Usuario</h2>
            <div className="info-row">
              <span><strong><FiDroplet /> Colateral:</strong></span>
              <span>{userData.collateral} cUSD</span>
            </div>
            <div className="info-row">
              <span><strong><FiCreditCard /> Deuda:</strong></span>
              <span>{userData.debt} dDAI</span>
            </div>
            <div className="info-row">
              <span><strong><FiDollarSign /> Interés:</strong></span>
              <span>{userData.interest} dDAI</span>
            </div>
          </section>
  
          <section className="actions">
            <h2><FiTool /> Acciones</h2>
            <button onClick={deposit}>
              <FiDownload /> Depositar
            </button>
            <button onClick={borrow}>
              <FiCreditCard /> Pedir Préstamo
            </button>
            <button onClick={repay}>
              <FiDollarSign /> Pagar
            </button>
            <button onClick={withdraw}>
              <FiUpload /> Retirar
            </button>
          </section>
  
          <section className="mint-section">
            <h2><FiCpu /> Mint Tokens (Modo Dev/Testnet)</h2>
            <button onClick={mintCollateral}>
              <FiDroplet /> Mint cUSD
            </button>
            <button onClick={mintLoanToken}>
              <FiZap /> Mint dDAI
            </button>
          </section>
  
          <section className="balances">
            <h2><FiPieChart /> Balances</h2>
            <div className="info-row">
              <span><strong><FiDroplet /> Balance cUSD:</strong></span>
              <span>{balanceCUSD}</span>
            </div>
            <div className="info-row">
              <span><strong><FiZap /> Balance dDAI:</strong></span>
              <span>{balanceDDAI}</span>
            </div>
            <button onClick={loadBalances}>
              <FiRepeat /> Actualizar Balances
            </button>
          </section>
        </>
      )}
  
      <ToastContainer position="bottom-right" autoClose={4000} />
    </div>
  );
}

export default App;
