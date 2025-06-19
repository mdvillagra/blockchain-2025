import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ABIs - Application Binary Interfaces
// Minimal ABIs for the functions we need to call
const lendingProtocolAbi = [
  "function depositCollateral(uint256 amount)",
  "function borrow(uint256 amount)",
  "function repay()",
  "function withdrawCollateral()",
  "function getUserData(address user) view returns (uint256 collateral, uint256 debt, uint256 interest)",
  "function INTEREST_RATE() view returns (uint256)"
];

const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Deployed Contract Addresses (replace with your actual addresses)
const lendingProtocolAddress = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
const collateralTokenAddress = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS;
const loanTokenAddress = import.meta.env.VITE_LOAN_TOKEN_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [userData, setUserData] = useState({ collateral: '0', debt: '0', interest: '0' });
  const [amount, setAmount] = useState('');
  const [notification, setNotification] = useState({ message: '', isError: false });

  useEffect(() => {
    if (account && signer) {
      initContracts();
    }
  }, [account, signer]);

  useEffect(() => {
    if (contracts.lendingProtocol) {
      loadUserData();
    }
  }, [contracts.lendingProtocol]);

  const displayNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification({ message: '', isError: false }), 5000);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      displayNotification("MetaMask is not installed!", true);
      return;
    }
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      displayNotification("Wallet connected successfully!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      displayNotification("Failed to connect wallet.", true);
    }
  };

  const initContracts = () => {
    if (!signer) return;
    const lendingContract = new ethers.Contract(lendingProtocolAddress, lendingProtocolAbi, signer);
    // Necesitamos una instancia del contrato de colateral para llamar a 'approve'
    const collateralContract = new ethers.Contract(collateralTokenAddress, erc20Abi, signer);
    const loanTokenContract = new ethers.Contract(loanTokenAddress, erc20Abi, signer);
    setContracts({
      lendingProtocol: lendingContract,
      collateralToken: collateralContract,
      loanToken: loanTokenContract
    });
  };

  const loadUserData = async () => {
    if (!contracts.lendingProtocol || !account) return;
    try {
      const data = await contracts.lendingProtocol.getUserData(account);
      setUserData({
        collateral: ethers.formatEther(data.collateral),
        debt: ethers.formatEther(data.debt),
        interest: ethers.formatEther(data.interest),
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      displayNotification("Could not load user data.", true);
    }
  };

  const handleTransaction = async (txFunction, successMessage) => {
    try {
      const tx = await txFunction();
      displayNotification("Transaction sent... waiting for confirmation.");
      await tx.wait();
      displayNotification(successMessage);
      loadUserData();
      setAmount('');
    } catch (error) {
      console.error("Transaction failed:", error);
      const errorMessage = error.reason || "Transaction failed.";
      displayNotification(errorMessage, true);
    }
  };

  const deposit = async () => {
    if (!amount || !contracts.collateralToken || !contracts.lendingProtocol) {
      displayNotification('Please enter an amount.', true);
      return;
    }
    const parsedAmount = ethers.parseEther(amount);
    await handleTransaction(async () => {
      displayNotification('Requesting approval to spend your cUSD...');
      const approveTx = await contracts.collateralToken.approve(lendingProtocolAddress, parsedAmount);
      await approveTx.wait();
      
      displayNotification('Approval successful! Now depositing collateral...');
      return contracts.lendingProtocol.depositCollateral(parsedAmount);
    }, 'Collateral deposited successfully!');
  };

  const borrow = async () => {
    if (!amount) return displayNotification("Please enter an amount.", true);
    const borrowAmount = ethers.parseEther(amount);
    
    await handleTransaction(
      () => contracts.lendingProtocol.borrow(borrowAmount),
      "Borrowed successfully!"
    );
  };

  const repay = async () => {
    const debt = ethers.parseEther(userData.debt);
    const interest = ethers.parseEther(userData.interest);
    let totalDebt = debt + interest;

    if (totalDebt <= 0n) {
      displayNotification("No debt to repay.", true);
      return;
    }
    await handleTransaction(async () => {
      displayNotification("Requesting approval to repay your debt...");
      const approveTx = await contracts.loanToken.approve(lendingProtocolAddress, totalDebt);
      await approveTx.wait();
      
      displayNotification("Approval successful! Now repaying debt...");
      return contracts.lendingProtocol.repay();
    }, "Debt repaid successfully!");
  };
  const withdraw = async () => {
    await handleTransaction(
      () => contracts.lendingProtocol.withdrawCollateral(),
      "Collateral withdrawn successfully!"
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1>Lending Protocol</h1>
      {notification.message && (
        <div style={{ padding: '10px', margin: '10px 0', color: 'white', backgroundColor: notification.isError ? 'red' : 'green' }}>
          {notification.message}
        </div>
      )}
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p><strong>Account:</strong> {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
          <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
            <h3>Your Position</h3>
            <p>Collateral: {parseFloat(userData.collateral).toFixed(4)} cUSD</p>
            <p>Debt: {parseFloat(userData.debt).toFixed(4)} dDAI</p>
            <p>Accrued Interest: {parseFloat(userData.interest).toFixed(4)} dDAI</p>
            <button onClick={loadUserData}>Refresh Data</button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>Actions</h3>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in ETH units"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={deposit}>Deposit Collateral</button>
              <button onClick={borrow}>Borrow</button>
              <button onClick={repay}>Repay Full Debt</button>
              <button onClick={withdraw} disabled={parseFloat(userData.debt) > 0}>Withdraw Collateral</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;