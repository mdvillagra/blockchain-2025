import { useState, useEffect } from 'react'
import './App.css'
import { ethers } from 'ethers'

import CollateralABI from './assets/CollateralTokenABI.json'
import LoanABI from './assets/LoanTokenABI.json'
import ProtocolABI from './assets/LendingProtocolABI.json'

function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contracts, setContracts] = useState({
    collateral: null,
    loan: null,
    protocol: null
  })
  const [balances, setBalances] = useState({
    cUSD: '0',
    dDAI: '0',
    collateralDeposited: '0',
    loanAmount: '0',
    interest: '0',
    totalDebt: '0'
  })

  // Initialize contracts
  useEffect(() => {
    if (!walletAddress || !window.ethereum) return

    const initContracts = async () => {
      const _provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(_provider)

      const _signer = await _provider.getSigner()
      setSigner(_signer)

      const collateral = new ethers.Contract(
        import.meta.env.VITE_COLLATERAL_CONTRACT_ADDRESS,
        CollateralABI.abi,
        _signer
      )
      const loan = new ethers.Contract(
        import.meta.env.VITE_LOAN_CONTRACT_ADDRESS,
        LoanABI.abi,
        _signer
      )
      const protocol = new ethers.Contract(
        import.meta.env.VITE_LENDING_CONTRACT_ADDRESS,
        ProtocolABI.abi,
        _signer
      )

      setContracts({ collateral, loan, protocol })

      // ✅ Mint initial tokens (protected in contract)
      try {
        const tx = await protocol.mintInitialCollateral()
        await tx.wait()
        console.log('Initial 1000 cUSD minted')
      } catch (err) {
        if (!err.message.includes('Already claimed')) {
          console.error('Initial mint failed:', err)
        } else {
          console.log('Initial mint already claimed')
        }
      }
    }

    initContracts()
  }, [walletAddress])

  // Load balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!contracts.protocol || !walletAddress) return

      try {
        const [cUSDBalance, dDAIBalance, userData] = await Promise.all([
          contracts.collateral.balanceOf(walletAddress),
          contracts.loan.balanceOf(walletAddress),
          contracts.protocol.getUserData(walletAddress)
        ])

        const totalDebt = userData.debt + userData.interest

        setBalances({
          cUSD: ethers.formatUnits(cUSDBalance, 18),
          dDAI: ethers.formatUnits(dDAIBalance, 18),
          collateralDeposited: ethers.formatUnits(userData.collateral, 18),
          loanAmount: ethers.formatUnits(userData.debt, 18),
          interest: ethers.formatUnits(userData.interest, 18),
          totalDebt: ethers.formatUnits(totalDebt, 18)
        })
      } catch (err) {
        console.error('Error loading balances:', err)
      }
    }

    loadBalances()
  }, [walletAddress, contracts])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask')
      return
    }

    try {
      //const sepoliaChainId = '0xaa36a7' // 11155111 in hex
      //const holeskyChainId = '0x4268' // 17000 in hex
      const localHardhatChainId = '0x7a69' // 31337 in hex



      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: localHardhatChainId }]
      })

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setWalletAddress(accounts[0])
    } catch (err) {
      console.error('Wallet connection error:', err)
      alert('Error connecting wallet: ' + err.message)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setBalances({
      cUSD: '0',
      dDAI: '0',
      collateralDeposited: '0',
      loanAmount: '0',
      interest: '0',
      totalDebt: '0'
    })
  }

  const depositCollateral = async () => {
    const amount = prompt('Enter cUSD amount to deposit:')
    if (!amount || isNaN(amount)) return

    try {
      const amountWei = ethers.parseUnits(amount, 18)

      const approveTx = await contracts.collateral.approve(
        import.meta.env.VITE_LENDING_CONTRACT_ADDRESS,
        amountWei
      )
      await approveTx.wait()

      const depositTx = await contracts.protocol.depositCollateral(amountWei)
      await depositTx.wait()

      alert('Deposit successful!')
    } catch (err) {
      alert('Deposit failed: ' + err.message)
    }
  }

  const borrowMax = async () => {
    try {
      const tx = await contracts.protocol.borrowMax()
      await tx.wait()
      alert('Loan taken successfully!')
    } catch (err) {
      alert('Loan failed: ' + err.message)
    }
  }

  const mintInterest = async () => {
    try {
      const tx = await contracts.protocol.mintInterest()
      await tx.wait()
      alert('Interest minted!')
    } catch (err) {
      alert('Mint interest failed: ' + err.message)
    }
  }

  const repayLoan = async () => {
    try {
      const totalDebtWei = ethers.parseUnits(balances.totalDebt, 18)

      const approveTx = await contracts.loan.approve(
        import.meta.env.VITE_LENDING_CONTRACT_ADDRESS,
        totalDebtWei
      )
      await approveTx.wait()

      const repayTx = await contracts.protocol.repayLoan()
      await repayTx.wait()

      alert('Loan repaid successfully!')
    } catch (err) {
      alert('Repayment failed: ' + err.message)
    }
  }

  const withdrawCollateral = async () => {
    try {
      const tx = await contracts.protocol.withdrawCollateral()
      await tx.wait()
      alert('Collateral withdrawn!')
    } catch (err) {
      alert('Withdrawal failed: ' + err.message)
    }
  }

  return (
    <div className="container">
      <div className="sidebar">
        {!walletAddress ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <>
            <button onClick={disconnectWallet}>Disconnect</button>
            <p>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          </>
        )}
      </div>

      <div className="main">
        <h1>Lending Protocol</h1>

        <div className="balances">
          <h2>Your Balances</h2>
          <div>Wallet cUSD: {balances.cUSD}</div>
          <div>Wallet dDAI: {balances.dDAI}</div>
          <div>Deposited cUSD: {balances.collateralDeposited}</div>
          <div>Current Loan: {balances.loanAmount}</div>
          <div>Interest (5%): {balances.interest}</div>
          <div>Total Debt: {balances.totalDebt}</div>
        </div>

        <div className="actions">
          <button onClick={depositCollateral}>Deposit cUSD</button>
          <button onClick={borrowMax}>Borrow Max dDAI</button>
          <button onClick={mintInterest}>Mint Interest</button>
          <button onClick={repayLoan}>Repay Loan</button>
          <button onClick={withdrawCollateral}>Withdraw Collateral</button>
        </div>
      </div>
    </div>
  )
}

export default App