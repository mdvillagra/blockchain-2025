import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CollateralToken from "../abi/CollateralToken.json";
import LoanToken from "../abi/LoanToken.json";
import LendingProtocol from "../abi/LendingProtocol.json";
import './index.css';


const VITE_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const VITE_COLLATERAL_TOKEN_ADDRESS = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
const VITE_LOAN_TOKEN_ADDRESS = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [collateral, setCollateral] = useState(0);
  const [debt, setDebt] = useState(0);
  const [interest, setInterest] = useState(0);
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    async function init() {
      if (!window.ethereum) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const loanContract = new ethers.Contract(VITE_CONTRACT_ADDRESS, LendingProtocol.abi, signer);

        setSigner(signer);
        setAccount(address);
        setContract(loanContract);

        loadUserData(loanContract, address);
      }
    }
    init();

    window.ethereum?.on("accountsChanged", () => window.location.reload());
  }, []);



  useEffect(() => {
    if (contract && account) {
      loadUserData();
    }
  }, [contract, account]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert('MetaMask no detectado');
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    setSigner(signer);

    const loanContract = new ethers.Contract(VITE_CONTRACT_ADDRESS, LendingProtocol.abi, signer);
    const address = await signer.getAddress();

    setAccount(address);
    setContract(loanContract);
  }

  async function loadUserData() {
    if (!contract || !account) return;
    const [userCollateral, userDebt, userInterest] = await contract.getUserData(account);
    setCollateral(ethers.utils.formatUnits(userCollateral, 18));
    setDebt(ethers.utils.formatUnits(userDebt, 18));
    setInterest(ethers.utils.formatUnits(userInterest, 18));
  }


  async function deposit(amountEth) {
    try {
      if (!amountEth || parseFloat(amountEth) <= 0) {
        alert('Ingresa una cantidad válida para depositar.');
        return;
      }

      const amount = ethers.utils.parseUnits(amountEth.toString(), 18);

      const collateralToken = new ethers.Contract(VITE_COLLATERAL_TOKEN_ADDRESS, CollateralToken.abi, signer);
      const approveTx = await collateralToken.approve(VITE_CONTRACT_ADDRESS, amount);
      await approveTx.wait();

      const tx = await contract.depositCollateral(amount);
      await tx.wait();
      await loadUserData(contract, account);
    } catch (err) {
      console.error('Error en deposit:', err);
      alert(`Error al depositar colateral: ${err.reason || err.message}`);
    }
  }


  async function borrow(amountEth) {
    try {
      if (!amountEth || parseFloat(amountEth) <= 0) {
        alert('Ingresa una cantidad válida para pedir prestado.');
        return;
      }

      if (parseFloat(collateral) <= 0) {
        alert('No tienes colateral disponible.');
        return;
      }

      const maxBorrow = (parseFloat(collateral) * 100) / 150;

      if (parseFloat(amountEth) > maxBorrow) {
        alert(`Supera el ratio de colateralización (150%). Máximo permitido: ${maxBorrow.toFixed(4)} tokens.`);
        return;
      }

      const parsedAmount = ethers.utils.parseUnits(amountEth.toString(), 18);
      const tx = await contract.borrow(parsedAmount);
      await tx.wait();
      await loadUserData(contract, account);
    } catch (err) {
      console.error('Error en borrow:', err);
      alert(`Error al pedir prestado: ${err.reason || err.message}`);
    }
  }


  async function repay() {
    try {
      if (!debt || parseFloat(debt) <= 0) {
        alert('No tienes deuda pendiente que pagar.');
        return;
      }

      const loan = ethers.utils.parseUnits(debt.toString(), 18);
      const interestAmount = loan.mul(5).div(100);
      const total = loan.add(interestAmount);

      const loanToken = new ethers.Contract(VITE_LOAN_TOKEN_ADDRESS, LoanToken.abi, signer);
      const approveTx = await loanToken.approve(VITE_CONTRACT_ADDRESS, total);
      await approveTx.wait();

      const tx = await contract.repay();
      await tx.wait();
      await loadUserData(contract, account);
    } catch (err) {
      console.error('Error en repay:', err);
      alert(`Error al repagar: ${err.reason || err.message}`);
    }
  }



  async function withdraw() {
    try {
      if (parseFloat(debt) > 0) {
        alert('No puedes retirar colateral si tienes deuda pendiente.');
        return;
      }

      const tx = await contract.withdrawCollateral();
      await tx.wait();
      await loadUserData(contract, account);
    } catch (error) {
      console.error("Error al retirar colateral:", error);
      if (error.code === 'CALL_EXCEPTION') {
        alert("No puedes retirar colateral. Verifica que no tengas deuda pendiente.");
      } else {
        alert(`Error al retirar colateral: ${error.reason || error.message}`);
      }
    }
  }



  return (
    <div className="min-h-screen w-full bg-[#1e1e1e] p-6 text-white space-y-6">
      <h1 className="text-4xl font-bold text-center text-green-400 mb-4">DApp de Préstamos</h1>

      {!account ? (
        <div className="flex justify-center">
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Conectar MetaMask
          </button>
        </div>
      ) : (
        <>
          {/* Info del usuario */}
          <div className="bg-green-100 text-green-900 p-4 rounded-lg shadow-md max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-2">Información de la cuenta</h2>
            <p><strong>Cuenta:</strong> {account}</p>
            <p><strong>Colateral:</strong> {collateral} cUSD</p>
            <p><strong>Deuda:</strong> {debt} dDAI</p>
            <p><strong>Interés acumulado:</strong> {interest} dDAI</p>
          </div>

          {/* Formulario para depositar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              //hace referencia al campo de entrada por su nombre (input)
              const amount = e.target.elements.depositAmount.value;
              deposit(amount);
            }}
            className="bg-white text-black p-4 rounded-lg shadow-md max-w-xl mx-auto"
          >
            <h3 className="font-semibold text-lg text-center  mb-2">Depositar colateral</h3>
            <div className="flex gap-2">
              <input
                name="depositAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Cantidad en cUSD"
                className="flex-1 p-2 border-2 border-black rounded-md placeholder:text-gray-600"
                required
              />
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md "
              >
                Depositar
              </button>
            </div>
          </form>

          {/* Formulario para pedir préstamo */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amount = e.target.elements.borrowAmount.value;
              borrow(amount);
            }}
            className="bg-white text-black p-4 rounded-lg shadow-md max-w-xl mx-auto"
          >
            <h3 className="font-semibold text-lg mb-2 text-center ">Pedir préstamo</h3>
            <div className="flex gap-2">
              <input
                name="borrowAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Cantidad en dDAI"
                className="flex-1 p-2 border-2 border-black rounded-md placeholder:text-gray-600"
                required
              />
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
              >
                Prestar
              </button>
            </div>
          </form>

          {/* Formulario para pagar deuda */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              repay();
            }}
            className="bg-white text-black p-4 rounded-lg shadow-md max-w-xl mx-auto"
          >
            <h3 className="font-semibold text-lg mb-2 text-center ">Pagar deuda + interés</h3>
            <p className="text-sm mb-2 text-center ">Interés fijo del 5% sobre la deuda actual</p>
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md w-40 mx-auto block"
            >
              Pagar
            </button>
          </form>

          {/* Botón para retirar colateral */}
          <div className="bg-white text-black p-4 rounded-lg shadow-md max-w-xl mx-auto">
            <h3 className="font-semibold text-lg text-center mb-2">Retirar Colateral</h3>
            <button
              onClick={withdraw}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md w-40 mx-auto block"
            >
              Retirar
            </button>
          </div>
        </>
      )}
    </div>
  );

}

export default App;
