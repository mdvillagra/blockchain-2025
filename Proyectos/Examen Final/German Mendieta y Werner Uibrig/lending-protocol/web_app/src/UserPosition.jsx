import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import contract artifacts - Fix the path
import lendingArtifact from '../../artifacts/contracts/LendingProtocol.sol/LendingProtocol.json';

const lendingABI = lendingArtifact.abi;

export default function UserPosition({ account, provider }) {
  const [position, setPosition] = useState({
    collateral: '0',
    debt: '0',
    totalInterest: '0',
    weeksPassed: '0',
    maxBorrowAmount: '0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState(null);

  const fetchUserData = async () => {
    if (!account || !provider) {
      setError('Wallet not connected');
      setDebugInfo('Please connect your wallet first');
      return;
    }

    const lendingAddress = import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS;
    
    setLoading(true);
    setError('');

    try {
      // Check network first
      const network = await provider.getNetwork();
      setCurrentNetwork(network);
      console.log('Connected to network:', network);
      
      // Debug information
      const debugData = {
        lendingAddress,
        account,
        rpcUrl: import.meta.env.VITE_RPC_URL,
        chainId: import.meta.env.VITE_CHAIN_ID,
        currentChainId: network.chainId.toString(),
        hasProvider: !!provider,
        networkName: network.name
      };
      
      setDebugInfo(`Debug Info: ${JSON.stringify(debugData, null, 2)}`);
      console.log('Debug Info:', debugData);

      if (!lendingAddress || lendingAddress === '' || lendingAddress === 'undefined') {
        setError('⚠️  Contracts not deployed yet. Please run: npm run setup');
        return;
      }

      // Validate that the address is a valid Ethereum address
      if (!ethers.isAddress(lendingAddress)) {
        throw new Error(`Invalid lending protocol address: ${lendingAddress}`);
      }

      if (network.chainId !== 31337n) {
        throw new Error(`WRONG_NETWORK`);
      }

      // Check if there's code at the address (contract exists)
      const code = await provider.getCode(lendingAddress);
      if (code === '0x') {
        throw new Error(`No contract deployed at address ${lendingAddress}. Please run: npm run setup`);
      }

      const lendingContract = new ethers.Contract(lendingAddress, lendingABI, provider);
      
      // Test the contract connection first
      try {
        // Try to call a simple view function first
        const collateralRatio = await lendingContract.COLLATERAL_RATIO();
        console.log('Contract connection successful, collateral ratio:', collateralRatio.toString());
      } catch (contractError) {
        throw new Error(`Contract connection failed: ${contractError.message}`);
      }
      
      // Call getUserData with error handling
      const userData = await lendingContract.getUserData(account);
      console.log('Raw user data:', userData);
      
      // Convert BigInt values to strings for display
      setPosition({
        collateral: ethers.formatEther(userData[0]),
        debt: ethers.formatEther(userData[1]),
        totalInterest: ethers.formatEther(userData[2]),
        weeksPassed: userData[3].toString(),
        maxBorrowAmount: ethers.formatEther(userData[4])
      });

    } catch (err) {
      console.error('Error fetching user data:', err);
      
      // Provide specific error messages
      if (err.message === 'WRONG_NETWORK') {
        setError(`🌐 Wrong Network Connected`);
      } else if (err.code === 'CALL_EXCEPTION') {
        setError('Contract call failed. Please check if contracts are properly deployed.');
      } else if (err.code === 'BAD_DATA') {
        setError('Invalid contract response. Contract may be corrupted or incompatible.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network connection failed. Make sure Hardhat node is running.');
      } else if (err.message?.includes('could not decode result data')) {
        setError('Contract not found or not properly deployed.');
      } else if (err.message?.includes('No contract deployed')) {
        setError(err.message);
      } else {
        setError(`Error: ${err.message || 'Unknown error'}`);
      }
      
      // Reset position to default values
      setPosition({
        collateral: '0',
        debt: '0',
        totalInterest: '0',
        weeksPassed: '0',
        maxBorrowAmount: '0'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to switch to Hardhat network
  const switchToHardhatNetwork = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed!');
      return;
    }

    try {
      // Try to switch to the Hardhat network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7A69', // 31337 in hex
                chainName: 'Hardhat Local',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: null,
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          alert('Failed to add Hardhat network to MetaMask');
        }
      } else {
        console.error('Error switching network:', switchError);
        alert('Failed to switch to Hardhat network');
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [account, provider]);

  // Retry function
  const handleRetry = () => {
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Your Position</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading position data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isWrongNetwork = error.includes('Wrong Network') || error.includes('🌐 Wrong Network');
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Your Position</h2>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="font-semibold">
              {isWrongNetwork ? 'Wrong Network Connected' : 'Error Loading Position'}
            </p>
          </div>
          
          {isWrongNetwork && currentNetwork && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 mb-2">
                <strong>Current Network:</strong> {currentNetwork.name} (Chain ID: {currentNetwork.chainId.toString()})
              </p>
              <p className="text-yellow-800 mb-3">
                <strong>Required Network:</strong> Hardhat Local (Chain ID: 31337)
              </p>
              <button
                onClick={switchToHardhatNetwork}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors font-semibold"
              >
                🔄 Switch to Hardhat Network
              </button>
            </div>
          )}
          
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-2 mb-4">
            <button
              onClick={handleRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => setDebugInfo(debugInfo ? '' : 'Showing debug info...')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              {debugInfo ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>

          {debugInfo && (
            <div className="text-left bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32 mb-4">
              <pre>{debugInfo}</pre>
            </div>
          )}
          
          <div className="text-sm text-gray-500 text-left">
            <p className="font-semibold mb-2">
              {isWrongNetwork ? 'Setup Instructions:' : 'To fix this issue:'}
            </p>
            
            {isWrongNetwork ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded border">
                  <p className="font-semibold text-blue-800">Method 1: Automatic (Recommended)</p>
                  <p className="text-blue-700">Click the "Switch to Hardhat Network" button above</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded border">
                  <p className="font-semibold text-green-800">Method 2: Manual Setup</p>
                  <ol className="list-decimal list-inside space-y-1 text-green-700">
                    <li>Open MetaMask</li>
                    <li>Click on the network dropdown (top center)</li>
                    <li>Select "Add Network" or "Custom RPC"</li>
                    <li>Fill in these details:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Network Name: <code>Hardhat Local</code></li>
                        <li>RPC URL: <code>http://127.0.0.1:8545</code></li>
                        <li>Chain ID: <code>31337</code></li>
                        <li>Currency Symbol: <code>ETH</code></li>
                      </ul>
                    </li>
                    <li>Save and switch to this network</li>
                  </ol>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="font-semibold text-gray-800">Make sure Hardhat node is running:</p>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">npx hardhat node</code>
                </div>
              </div>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                <li>Open terminal in project root</li>
                <li>Run: <code className="bg-gray-200 px-1 rounded">npm run setup</code></li>
                <li>Wait for "✅ Contracts deployed successfully"</li>
                <li>Make sure Hardhat node is running on port 8545</li>
                <li>Connect MetaMask to localhost:8545 network</li>
                <li>Click Retry above</li>
              </ol>
            )}
            
            <div className="mt-3 pt-3 border-t">
              <p className="font-semibold">Quick diagnosis:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Contract Address: {import.meta.env.VITE_LENDING_PROTOCOL_ADDRESS || '❌ Not set'}</li>
                <li>RPC URL: {import.meta.env.VITE_RPC_URL || '❌ Not set'}</li>
                <li>Expected Chain ID: {import.meta.env.VITE_CHAIN_ID || '❌ Not set'}</li>
                <li>Current Chain ID: {currentNetwork?.chainId?.toString() || '❌ Unknown'}</li>
                <li>Wallet Connected: {account ? '✅ Yes' : '❌ No'}</li>
                <li>Provider Available: {provider ? '✅ Yes' : '❌ No'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const collateralValue = parseFloat(position.collateral);
  const debtValue = parseFloat(position.debt);
  const interestValue = parseFloat(position.totalInterest);
  const totalDebt = debtValue + interestValue;
  const availableToBorrow = parseFloat(position.maxBorrowAmount) - debtValue;
  const healthRatio = debtValue > 0 ? (collateralValue / (debtValue * 1.5)) * 100 : 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Position</h2>
        <div className="flex items-center space-x-2">
          {currentNetwork && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {currentNetwork.name} ({currentNetwork.chainId.toString()})
            </span>
          )}
          <button
            onClick={handleRetry}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="Refresh data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Collateral Deposited</label>
            <p className="text-2xl font-bold text-green-600">{collateralValue.toFixed(4)} cUSD</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Current Debt</label>
            <p className="text-2xl font-bold text-red-600">{debtValue.toFixed(4)} dDAI</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Accrued Interest</label>
            <p className="text-lg font-semibold text-orange-600">{interestValue.toFixed(4)} dDAI</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Total to Repay</label>
            <p className="text-2xl font-bold text-purple-600">{totalDebt.toFixed(4)} dDAI</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Available to Borrow</label>
            <p className="text-lg font-semibold text-blue-600">{Math.max(0, availableToBorrow).toFixed(4)} dDAI</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Weeks Passed</label>
            <p className="text-lg font-semibold">{position.weeksPassed}</p>
          </div>
        </div>
      </div>
      
      {debtValue > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <label className="block text-sm text-gray-600 mb-1">Health Ratio</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  healthRatio >= 80 ? 'bg-green-500' : 
                  healthRatio >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, healthRatio)}%` }}
              ></div>
            </div>
            <span className={`text-sm font-semibold ${
              healthRatio >= 80 ? 'text-green-600' : 
              healthRatio >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthRatio.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Health ratio shows collateral coverage. Above 100% is safe.
          </p>
        </div>
      )}
    </div>
  );
}



