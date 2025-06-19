import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import contractABI from "./contractABI.json";

const contractAddress = "0x8459E531D678555F9A58336492Ee469639838d13";
const collateralTokenAddress = "0x4092351B06e61E704357b4dee71FA2D773010825"; // cUSD
const loanTokenAddress = "0x8CB9AC7a34cc91EA97A261DE64af02DD0D944F30";   // dDAI

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
  const [collateralToken, setCollateralToken] = useState(null);
  const [loanToken, setLoanToken] = useState(null);

  useEffect(() => {
    if (!account) return;
    initContracts();
  }, [account]);

  const initContracts = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const collateral = new ethers.Contract(collateralTokenAddress, erc20ABI, signer);
      const loan = new ethers.Contract(loanTokenAddress, erc20ABI, signer);
      const lending = new ethers.Contract(contractAddress, contractABI, signer);

      setCollateralToken(collateral);
      setLoanToken(loan);
      setProtocol(lending);
    } catch (err) {
      console.error("Error initializing contracts:", err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask no detectado");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0]);
  };

  const loadUserData = async () => {
    if (!protocol || !account) return;
    const [col, debt, interest] = await protocol.getUserData(account);
    setUserData({
      collateral: ethers.formatEther(col),
      debt: ethers.formatEther(debt),
      interest: ethers.formatEther(interest)
    });
  };

  const loadBalances = async () => {
    if (!account || !collateralToken || !loanToken) return;
    const [cBal, dBal] = await Promise.all([
      collateralToken.balanceOf(account),
      loanToken.balanceOf(account)
    ]);
    setBalanceCUSD(ethers.formatEther(cBal));
    setBalanceDDAI(ethers.formatEther(dBal));
  };

  const approveIfNeeded = async (token, amount) => {
    const allowance = await token.allowance(account, contractAddress);
    if (allowance < amount) {
      const tx = await token.approve(contractAddress, amount);
      await tx.wait();
    }
  };

  const promptAmount = (message) => {
    const input = prompt(message);
    if (!input || Number.isNaN(Number(input)) || Number(input) <= 0) {
      alert("Cantidad inválida");
      return null;
    }
    return ethers.parseEther(input);
  };

  const deposit = async () => {
    const weiAmount = promptAmount("¿Cuánto cUSD querés depositar?");
    if (!weiAmount) return;

    const balance = await collateralToken.balanceOf(account);
    if (balance < weiAmount) return alert("No tenés suficientes cUSD");

    await approveIfNeeded(collateralToken, weiAmount);
    const tx = await protocol.depositCollateral(weiAmount);
    await tx.wait();

    alert("Depósito exitoso");
    await loadUserData();
    await loadBalances();
  };

  const borrow = async () => {
    const [collateral] = await protocol.getUserData(account);
    const maxBorrow = collateral * 66n / 100n;

    const amount = promptAmount(`¿Cuánto dDAI querés pedir prestado? (máx: ${ethers.formatEther(maxBorrow)} dDAI)`);
    if (!amount || amount > maxBorrow) {
      return alert("Supera el límite permitido por tu colateral");
    }

    const tx = await protocol.borrow(amount);
    await tx.wait();
    alert("Préstamo exitoso");
    await loadUserData();
    await loadBalances();
  };

  const repay = async () => {
    const [, debt, interest] = await protocol.getUserData(account);
    const total = debt + interest;

    await approveIfNeeded(loanToken, total);
    const tx = await protocol.repay();
    await tx.wait();

    alert("Pago realizado con éxito");
    await loadUserData();
    await loadBalances();
  };

  const withdraw = async () => {
    const tx = await protocol.withdrawCollateral();
    await tx.wait();
    alert("Colateral retirado");
    await loadUserData();
    await loadBalances();
  };

  const mintToken = async (token, label) => {
    const weiAmount = promptAmount(`¿Cuánto ${label} querés mintear?`);
    if (!weiAmount) return;

    const tx = await token.mint(account, weiAmount);
    await tx.wait();

    alert(`Se mintaron ${ethers.formatEther(weiAmount)} ${label} a tu cuenta`);
    await loadBalances();
  };

  return (
    <div>
      <h1>Lending DApp</h1>
      {!account ? (
        <button onClick={connectWallet}>Conectar Wallet</button>
      ) : (
        <>
          <p><strong>Cuenta:</strong> {account}</p>
          <button onClick={loadUserData}>Cargar Datos</button>
          <p>Colateral: {userData.collateral} cUSD</p>
          <p>Deuda: {userData.debt} dDAI</p>
          <p>Interés: {userData.interest} dDAI</p>

          <hr />
          <button onClick={deposit}>Depositar</button>
          <button onClick={borrow}>Pedir Préstamo</button>
          <button onClick={repay}>Pagar</button>
          <button onClick={withdraw}>Retirar</button>

          <hr />
          <button onClick={() => mintToken(collateralToken, "cUSD")}>Mint cUSD</button>
          <button onClick={() => mintToken(loanToken, "dDAI")}>Mint dDAI</button>

          <p><strong>Balance cUSD:</strong> {balanceCUSD}</p>
          <p><strong>Balance dDAI:</strong> {balanceDDAI}</p>
          <button onClick={loadBalances}>Actualizar Balances</button>
        </>
      )}
    </div>
  );
}

export default App;
