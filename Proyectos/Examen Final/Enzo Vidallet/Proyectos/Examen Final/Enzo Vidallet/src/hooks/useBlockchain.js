import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  SEPOLIA_CHAIN_ID,
  LENDING_PROTOCOL_ABI,
  TOKEN_ABI,
} from '../constants/contracts';

export default function useBlockchain() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [userBalance, setUserBalance] = useState({ collateral: '0', loan: '0' });
  const [userPosition, setUserPosition] = useState({ collateral: '0', debt: '0', interest: '0' });
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');

  // Validate current network is Sepolia
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setNetworkError('Please connect to Sepolia Testnet');
        return false;
      }
      setNetworkError('');
      return true;
    } catch {
      return false;
    }
  }, []);

  // Prompt wallet to switch to Sepolia
  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setNetworkError('');
      return true;
    } catch {
      return false;
    }
  }, []);

  // Initialize provider, signer and contracts
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    // Ensure correct network
    const onSepolia = await checkNetwork();
    if (!onSepolia) {
      const switched = await switchToSepolia();
      if (!switched) return;
    }

    const ethersProvider = new ethers.BrowserProvider(window.ethereum);
    const ethersSigner = await ethersProvider.getSigner();
    const user = await ethersProvider.send('eth_requestAccounts', []);

    setProvider(ethersProvider);
    setSigner(ethersSigner);
    setAccount(user[0]);

    // Instantiate contract instances
    setContracts({
      lendingProtocol: new ethers.Contract(
        CONTRACT_ADDRESSES.lendingProtocol,
        LENDING_PROTOCOL_ABI,
        ethersSigner
      ),
      collateralToken: new ethers.Contract(
        CONTRACT_ADDRESSES.collateralToken,
        TOKEN_ABI,
        ethersSigner
      ),
      loanToken: new ethers.Contract(
        CONTRACT_ADDRESSES.loanToken,
        TOKEN_ABI,
        ethersSigner
      ),
    });
  }, [checkNetwork, switchToSepolia]);

  // Load balances and user position
  const loadUserData = useCallback(async () => {
    if (!contracts.lendingProtocol || !account) return;
    try {
      const [colBal, loanBal] = await Promise.all([
        contracts.collateralToken.balanceOf(account),
        contracts.loanToken.balanceOf(account),
      ]);
      setUserBalance({
        collateral: ethers.formatEther(colBal),
        loan: ethers.formatEther(loanBal),
      });

      const [col, debt, interest] = await contracts.lendingProtocol.getUserData(account);
      setUserPosition({
        collateral: ethers.formatEther(col),
        debt: ethers.formatEther(debt),
        interest: ethers.formatEther(interest),
      });
    } catch (err) {
      console.error('loadUserData error', err);
    }
  }, [contracts, account]);

  // Mint test tokens (1000 each)
  const getTestTokens = useCallback(async () => {
    if (!contracts.collateralToken || !contracts.loanToken) return;
    setLoading(true);
    try {
      const amount = ethers.parseEther('1000');
      await (await contracts.collateralToken.mint(account, amount)).wait();
      await (await contracts.loanToken.mint(account, amount)).wait();
      await loadUserData();
      alert('Minted 1000 cUSD and 1000 dDAI');
    } catch (err) {
      console.error('getTestTokens error', err);
      alert('Failed to mint test tokens');
    } finally {
      setLoading(false);
    }
  }, [contracts, account, loadUserData]);

  // Deposit collateral
  const deposit = useCallback(async (amountStr) => {
    if (!contracts.lendingProtocol) return;
    setLoading(true);
    try {
      const amount = ethers.parseEther(amountStr);
      await (await contracts.collateralToken.approve(CONTRACT_ADDRESSES.lendingProtocol, amount)).wait();
      await (await contracts.lendingProtocol.depositCollateral(amount)).wait();
      await loadUserData();
    } catch (err) {
      console.error('deposit error', err);
      alert('Deposit failed');
    } finally {
      setLoading(false);
    }
  }, [contracts, loadUserData]);

  // Borrow tokens
  const borrow = useCallback(async (amountStr) => {
    if (!contracts.lendingProtocol) return;
    setLoading(true);
    try {
      const amount = ethers.parseEther(amountStr);
      await (await contracts.lendingProtocol.borrow(amount)).wait();
      await loadUserData();
    } catch (err) {
      console.error('borrow error', err);
      alert('Borrow failed');
    } finally {
      setLoading(false);
    }
  }, [contracts, loadUserData]);

  // Repay outstanding debt + interest
  const repay = useCallback(async () => {
    if (!contracts.lendingProtocol) return;
    setLoading(true);
    try {
      const total = ethers.parseEther(
        (parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toString()
      );
      await (await contracts.loanToken.approve(CONTRACT_ADDRESSES.lendingProtocol, total)).wait();
      await (await contracts.lendingProtocol.repay()).wait();
      await loadUserData();
    } catch (err) {
      console.error('repay error', err);
      alert('Repay failed');
    } finally {
      setLoading(false);
    }
  }, [contracts, userPosition, loadUserData]);

  // Withdraw collateral
  const withdraw = useCallback(async () => {
    if (!contracts.lendingProtocol) return;
    setLoading(true);
    try {
      await (await contracts.lendingProtocol.withdrawCollateral()).wait();
      await loadUserData();
    } catch (err) {
      console.error('withdraw error', err);
      alert('Withdraw failed');
    } finally {
      setLoading(false);
    }
  }, [contracts, loadUserData]);

  // Compute max borrowable based on 150% collateralization
  const getMaxBorrowable = useCallback(() => {
    const col = parseFloat(userPosition.collateral);
    const debt = parseFloat(userPosition.debt) + parseFloat(userPosition.interest);
    const max = (col * 100) / 150;
    return Math.max(0, max - debt).toFixed(6);
  }, [userPosition]);

  // Effects
  useEffect(() => {
    if (account && contracts.lendingProtocol) {
      loadUserData();
    }
  }, [account, contracts, loadUserData]);

  // Handle account or network changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(''); setContracts({});
      } else {
        connectWallet();
      }
    };
    const onChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, [connectWallet]);

  return {
    account,
    networkError,
    loading,
    userBalance,
    userPosition,
    contracts,
    connectWallet,
    getTestTokens,
    deposit,
    borrow,
    repay,
    withdraw,
    getMaxBorrowable,
  };
}
