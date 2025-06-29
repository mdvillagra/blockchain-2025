import { useState, useEffect } from "react";
import { ethers } from "ethers";
const { parseEther, formatEther } = ethers.utils;
import "./App.css";

window.ethers = ethers;

const LENDING_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const COLLATERAL_ADDRESS = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
const loanTokenAddress = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;


console.log("LENDING_ADDRESS:", LENDING_ADDRESS);
console.log("COLLATERAL_ADDRESS:", COLLATERAL_ADDRESS);


const LENDING_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function borrow(uint256 amount) external",
  "function repay() external payable",
  "function withdrawCollateral() external",
  "function getUserData(address user) view returns (uint256,uint256,uint256)"
];

const COLLATERAL_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

const LOAN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function mint(address to, uint256 amount) public"

];

function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [lendingContract, setLendingContract] = useState(null);
  const [collateralContract, setCollateralContract] = useState(null);
  const [loanContract, setLoanContract] = useState(null);


  const [collateral, setCollateral] = useState("0");
  const [debt, setDebt] = useState("0");
  const [interest, setInterest] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [daiBalance, setDaiBalance] = useState("0");


  const [depositInput, setDepositInput] = useState("");
  const [borrowInput, setBorrowInput] = useState("");

  const [loading, setLoading] = useState(false);


  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Instalá MetaMask para continuar");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Esto abre la ventana para conectar cuentas
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const lending = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
      const collateral = new ethers.Contract(COLLATERAL_ADDRESS, COLLATERAL_ABI, signer);
      const loan = new ethers.Contract(loanTokenAddress, LOAN_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setAccount(await signer.getAddress());
      setLendingContract(lending);
      setCollateralContract(collateral);
      setLoanContract(loan);
    } catch (error) {
      console.error("Error al conectar MetaMask:", error);
    }
  };

  const loadUserData = async () => {
    if (!lendingContract || !collateralContract || !account) return;

    const data = await lendingContract.getUserData(account);
    setCollateral(formatEther(data[0]));
    setDebt(formatEther(data[1]));
    setInterest(formatEther(data[2]));

    const balance = await collateralContract.balanceOf(account);

    setWalletBalance(formatEther(balance));

    const ddaiBalance = await loanContract.balanceOf(account);
    setDaiBalance(formatEther(ddaiBalance));

  };

  const deposit = async () => {
    try {
      const amount = parseEther(depositInput);

      const balance = await collateralContract.balanceOf(account);

      const formatted = formatEther(balance);
      console.log("💼 Raw balance:", balance.toString());
      console.log("📌 Formatted balance:", formatted);
      console.log("👉 Account:", account);
      console.log("👉 Amount a depositar:", amount.toString());

      if (balance.lt(amount)) {
        alert("❌ No tenés suficientes cUSD para realizar el depósito.");
        return;
      }

      const allowance = await collateralContract.allowance(account, LENDING_ADDRESS);
      if (allowance < amount) {
        const approveTx = await collateralContract.approve(LENDING_ADDRESS, amount);
        await approveTx.wait();
      }
      const tx = await lendingContract.depositCollateral(amount);
      await tx.wait();
      setDepositInput("");
      await loadUserData();
      alert("✅ Depósito realizado con éxito.");
    } catch (error) {
      alert("❌ Error al depositar: " + (error?.reason || error.message || "Transacción fallida."));
      console.error(error);
    }
  };
  const borrow = async () => {
    try {
      const amount = parseEther(borrowInput);
      const userData = await lendingContract.getUserData(account);
      const collateral = userData[0]; // BigNumber

      const hundred = ethers.BigNumber.from("100");
      const collateralRatio = ethers.BigNumber.from("150");

      const maxBorrow = collateral.mul(hundred).div(collateralRatio);

      console.log("👉 rawCollateral:", collateral.toString());
      console.log("👉 amount to borrow:", amount.toString());
      console.log("👉 maxBorrow (raw):", maxBorrow.toString());

      if (amount.gt(maxBorrow)) {
        alert(`❌ Solo podés pedir hasta ${formatEther(maxBorrow)} dDAI según tu colateral.`);
        return;
      }

      const tx = await lendingContract.borrow(amount);
      await tx.wait();
      setBorrowInput("");
      await loadUserData();
      alert("✅ Préstamo solicitado con éxito.");
    } catch (error) {
      alert("❌ Error al pedir el préstamo: " + (error?.reason || error.message || "Transacción fallida."));
      console.error(error);
    }
  };


  const repay = async () => {
    try {
      const total = parseEther((parseFloat(debt) + parseFloat(interest)).toString());

      const balance = await loanContract.balanceOf(account);
      const allowance = await loanContract.allowance(account, LENDING_ADDRESS);

      console.log("➡️ Balance dDAI:", formatEther(balance));
      console.log("➡️ Allowance dDAI:", formatEther(allowance));
      console.log("➡️ Total a repagar:", formatEther(total));

      if (balance.lt(total)) {
        alert("❌ No tenés suficientes dDAI para repagar.");
        return;
      }

      if (allowance.lt(total)) {
        const approveTx = await loanContract.approve(LENDING_ADDRESS, total);
        await approveTx.wait();
      }

      const tx = await lendingContract.repay();
      await tx.wait();
      await loadUserData();
      alert("✅ Préstamo repagado con éxito.");
    } catch (error) {
      alert("❌ Error al repagar: " + (error?.reason || error.message || "Transacción fallida."));
      console.error(error);
    }
  };



  const withdraw = async () => {
    try {
      const tx = await lendingContract.withdrawCollateral();
      await tx.wait();
      await loadUserData();
      alert("✅ Colateral retirado con éxito.");
    } catch (error) {
      alert("❌ Error al retirar colateral: " + (error?.reason || error.message || "Asegurate de no tener deuda."));
      console.error(error);
    }
  };


  useEffect(() => {
    if (account) loadUserData();
  }, [account]);


  return (
    <div className="container">
      <h1>NexusLend Protocol</h1>

      {!account ? (
        <button onClick={connectWallet}>Conectar Wallet</button>
      ) : (
        <>


          {/* 🔻 Aquí van los botones de minteo */}
          <button onClick={async () => {
            try {
              const tx1 = await collateralContract.mint(account, ethers.utils.parseUnits("1000", 18));
              await tx1.wait();
              alert("✅ Minteaste 1000 cUSD");
              await loadUserData();
            } catch (err) {
              console.error(err);
              alert("❌ Error al mintear cUSD");
            }
          }}>
            Mint cUSD (1000)
          </button>

          <button onClick={async () => {
            try {
              const tx2 = await loanContract.mint(account, ethers.utils.parseUnits("500", 18));
              await tx2.wait();
              alert("✅ Minteaste 500 dDAI");
              await loadUserData();
            } catch (err) {
              console.error(err);
              alert("❌ Error al mintear dDAI");
            }
          }}>
            Mint dDAI (500)
          </button>

          <h2>Datos del Usuario</h2>
          <p>Cuenta: {account}</p>
          <p>Balance Wallet cUSD: {parseFloat(walletBalance).toFixed(4)} cUSD</p>
          <p>Balance Wallet dDAI: {parseFloat(daiBalance).toFixed(4)} dDAI</p>
          <p>Colateral: {parseFloat(collateral).toFixed(4)} cUSD</p>
          <p>Deuda: {parseFloat(debt).toFixed(4)} dDAI</p>
          <p>Interés: {parseFloat(interest).toFixed(4)} dDAI</p>

          <input
            type="number"
            placeholder="Depositar cUSD"
            value={depositInput}
            onChange={(e) => setDepositInput(e.target.value)}
          />
          <button onClick={deposit}>Depositar</button>

          <input
            type="number"
            placeholder="Pedir préstamo dDAI"
            value={borrowInput}
            onChange={(e) => setBorrowInput(e.target.value)}
          />
          <button onClick={borrow}>Pedir Préstamo</button>

          <button onClick={repay}>Repagar</button>
          <button onClick={withdraw}>Retirar Colateral</button>


        </>
      )}
    </div>
  );

}
export default App;

