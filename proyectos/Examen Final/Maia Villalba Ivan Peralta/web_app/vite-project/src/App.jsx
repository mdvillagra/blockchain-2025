import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LendingProtocolABI from './abis/LendingProtocolABI.json';
import CollateralTokenABI from './abis/CollateralTokenABI.json';
import LoanTokenABI from './abis/LoanTokenABI.json';
import LendingInterface from './LendingInterface.jsx';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [collateral, setCollateral] = useState(0);
  const [debt, setDebt] = useState(0);
  const [interest, setInterest] = useState(0);
  const [amount, setAmount] = useState("");
  const [tokenBalances, setTokenBalances] = useState({ cUSD: "0", dDAI: "0" });

  useEffect(() => {
    if (account && contract) {
      loadUserData();
      checkTokenBalances();
    }
  }, [account, contract]);

  async function connectWallet() {
    if (!window.ethereum) return alert("Instalá MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setAccount(address);

    const lending = new ethers.Contract(CONTRACT_ADDRESS, LendingProtocolABI, signer);
    setContract(lending);
  }

  async function loadUserData() {
    const [col, deb, intRate] = await contract.getUserData(account);
    setCollateral(ethers.formatEther(col));
    setDebt(ethers.formatEther(deb));
    setInterest(ethers.formatEther(intRate));
  }

  async function checkTokenBalances() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const collateralToken = new ethers.Contract(
      import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS,
      CollateralTokenABI,
      signer
    );

    const loanToken = new ethers.Contract(
      import.meta.env.VITE_LOAN_TOKEN_ADDRESS,
      LoanTokenABI,
      signer
    );

    const cUSDBalance = await collateralToken.balanceOf(address);
    const dDAIBalance = await loanToken.balanceOf(address);

    setTokenBalances({
      cUSD: ethers.formatEther(cUSDBalance),
      dDAI: ethers.formatEther(dDAIBalance),
    });

    console.log("Saldo cUSD:", ethers.formatEther(cUSDBalance));
    console.log("Saldo dDAI:", ethers.formatEther(dDAIBalance));
  }

  async function deposit() {
    try {
      const amountWeiValidation = ethers.parseEther(amount);
      const balanceWei = ethers.parseEther(tokenBalances.cUSD);

      if (amountWeiValidation > balanceWei) {
        return alert("No tienes suficientes cUSD para depositar");
      }
      if (amountWeiValidation <= 0) {
        return alert("El monto debe ser mayor a 0");
      }
      const amountWei = ethers.parseEther(amount);

      // Obtener signer real de MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Crear instancia del token con ese signer
      const collateralToken = new ethers.Contract(
        import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS,
        CollateralTokenABI,
        signer
      );

      // Aprobar al contrato para mover tus tokens
      const approveTx = await collateralToken.approve(contract.target, amountWei);
      await approveTx.wait();

      // Ejecutar el depósito usando el contrato
      const tx = await contract.connect(signer).depositCollateral(amountWei);
      await tx.wait();

      loadUserData();
      checkTokenBalances();
    } catch (err) {
      console.error("Error al depositar:", err);
      alert("Error al depositar. Revisa si aprobaste correctamente cUSD.");
    }
  }


  async function borrow() {
    try { 
      if (amount <= 0) {
        return alert("El monto debe ser mayor a 0");
      }
      const amountWei = ethers.parseEther(amount);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await contract.connect(signer).borrow(amountWei);
      await tx.wait();

      loadUserData();
      checkTokenBalances();
    } catch (err) {
      console.error("Error al pedir préstamo:", err);
      const errorMessage = err.message;

    // Buscar el mensaje específico del revert
    const revertMatch = errorMessage.match(/reverted: \"(.+?)\"/);
    if (revertMatch && revertMatch[1]) {
      // Mostrar el mensaje específico del contrato
      alert(`Error al pedir préstamo: ${revertMatch[1]}`);
    } else {
      // Mostrar mensaje genérico si no se encuentra un mensaje específico
      alert("Error al pedir préstamo. Por favor, verifica los requisitos.");
    }
    }
  }

  async function repay() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const debtWei = ethers.parseEther(debt);
      const interestWei = ethers.parseEther(interest);
      const totalWei = debtWei + interestWei;

      const loanToken = new ethers.Contract(import.meta.env.VITE_LOAN_TOKEN_ADDRESS, LoanTokenABI, signer);

      const approveTx = await loanToken.approve(contract.target, totalWei);
      await approveTx.wait();

      const tx = await contract.connect(signer).repay();
      await tx.wait();

      loadUserData();
      checkTokenBalances();
    } catch (err) {
      console.error("Error al repagar préstamo:", err);
      const errorMessage = err.message;
      // Buscar el mensaje específico del revert
      const revertMatch = errorMessage.match(/reverted: \"(.+?)\"/);
      if (revertMatch && revertMatch[1]) {
        // Mostrar el mensaje específico del contrato
        alert(`Error al repagar préstamo: ${revertMatch[1]}`);
      } else {
        // Verificar si es un error de aprobación
        if (errorMessage.includes("insufficient allowance")) {
          alert("Error: No has aprobado suficientes tokens dDAI para el repago");
        } else if (errorMessage.includes("insufficient balance")) {
          alert("Error: No tienes suficientes tokens dDAI para repagar");
        } else {
          // Mensaje genérico si no se identifica el error específico
          alert("Error al repagar préstamo. Verifica que tengas suficientes dDAI y hayas aprobado la transferencia.");
        }
      }
    }
  }

  async function withdraw() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await contract.connect(signer).withdrawCollateral();
      await tx.wait();

      loadUserData();
      checkTokenBalances();
    } catch (err) {
      console.error("Error al retirar colateral:", err);
      const errorMessage = err.message;

      const revertMatch = errorMessage.match(/reverted: \"(.+?)\"/);
      if (revertMatch && revertMatch[1]) {
        alert(`Error al retirar colateral: ${revertMatch[1]}`);
      } else {
        alert("Error al retirar colateral. Verifica que no tengas deudas pendientes.");
      }
    }
  }

  return (
    <LendingInterface
      account={account}
      connectWallet={connectWallet}
      collateral={collateral}
      debt={debt}
      interest={interest}
      amount={amount}
      setAmount={setAmount}
      deposit={deposit}
      borrow={borrow}
      repay={repay}
      withdraw={withdraw}
      tokenBalances={tokenBalances}
      checkTokenBalances={checkTokenBalances}
    />
  );
}

export default App;
