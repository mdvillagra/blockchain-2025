import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [collateralBalance, setCollateralBalance] = useState("0");
  const [loanBalance, setLoanBalance] = useState("0");
  const [collateralInput, setCollateralInput] = useState("");
  const [borrowInput, setBorrowInput] = useState("");

  const COLLATERAL_ADDRESS = "0x3D2ca253f2e58e138Da432dc7aED1b77c2021143";
  const LOAN_ADDRESS = "0x13D1FAACde3477d5D6a20a6b466261b1Bd528da9";
  const PROTOCOL_ADDRESS = "0x4d370733441E86B4EDFC18135858C76a2a9Ac7b6";

  const CollateralTokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ];
  const LoanTokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ];
  const LendingProtocolABI = [
    "function depositCollateral(uint256) public",
    "function borrow(uint256) public",
    "function repay() public",
    "function withdrawCollateral() public",
    "function collateralBalances(address) view returns (uint256)",
    "function loanBalances(address) view returns (uint256)"
  ];

  const connectWallet = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  };

  const loadBalances = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const loan = new ethers.Contract(LOAN_ADDRESS, LoanTokenABI, signer);
    const protocol = new ethers.Contract(PROTOCOL_ADDRESS, LendingProtocolABI, signer);

    const colBal = await protocol.collateralBalances(signer.address);
    const loanBal = await loan.balanceOf(signer.address);

    setCollateralBalance(ethers.formatUnits(colBal, 18));
    setLoanBalance(ethers.formatUnits(loanBal, 18));
  };

  const handleDeposit = async () => {
    if (!collateralInput) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const collateral = new ethers.Contract(COLLATERAL_ADDRESS, CollateralTokenABI, signer);
    const protocol = new ethers.Contract(PROTOCOL_ADDRESS, LendingProtocolABI, signer);

    const amount = ethers.parseUnits(collateralInput, 18);
    await (await collateral.approve(PROTOCOL_ADDRESS, amount)).wait();
    await (await protocol.depositCollateral(amount)).wait();
    await loadBalances();
  };

  const handleBorrow = async () => {
    if (!borrowInput) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const protocol = new ethers.Contract(PROTOCOL_ADDRESS, LendingProtocolABI, signer);
    const amount = ethers.parseUnits(borrowInput, 18);
    await (await protocol.borrow(amount)).wait();
    await loadBalances();
  };

  const handleRepay = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const loan = new ethers.Contract(LOAN_ADDRESS, LoanTokenABI, signer);
    const protocol = new ethers.Contract(PROTOCOL_ADDRESS, LendingProtocolABI, signer);

    const debt = await protocol.loanBalances(signer.address);
    const interest = debt / 20n;
    const total = debt + interest;

    await (await loan.approve(PROTOCOL_ADDRESS, total)).wait();
    await (await protocol.repay()).wait();
    await loadBalances();
  };

  const handleWithdraw = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const protocol = new ethers.Contract(PROTOCOL_ADDRESS, LendingProtocolABI, signer);
    await (await protocol.withdrawCollateral()).wait();
    await loadBalances();
  };

  useEffect(() => {
    if (account) loadBalances();
  }, [account]);

  return (
    <div className="App">
      <h1>Lending DApp</h1>
      {!account ? (
        <button onClick={connectWallet}>Conectar Wallet</button>
      ) : (
        <>
          <p>Wallet conectada: {account}</p>
          <p>Colateral en protocolo: {collateralBalance}</p>
          <p>Préstamo disponible: {loanBalance}</p>

          <input
            placeholder="Cantidad de colateral"
            type="number"
            value={collateralInput}
            onChange={(e) => setCollateralInput(e.target.value)}
          />
          <button onClick={handleDeposit}>Depositar</button>

          <input
            placeholder="Cantidad a pedir"
            type="number"
            value={borrowInput}
            onChange={(e) => setBorrowInput(e.target.value)}
          />
          <button onClick={handleBorrow}>Pedir préstamo</button>

          <button onClick={handleRepay}>Repagar</button>
          <button onClick={handleWithdraw}>Retirar Colateral</button>
        </>
      )}
    </div>
  );
}

export default App;


