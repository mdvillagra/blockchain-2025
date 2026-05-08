import React, { useState, useEffect } from 'react';
import { WalletProvider } from './components/WalletProviders';
import { LendingDashboard } from './components/LendingDashboard';
import { DepositModal } from './components/DepositModal';
import { BorrowModal } from './components/BorrowModal';
import { RepayModal } from './components/RepayModal';
import { WithdrawModal } from './components/WithdrawModal';
import {
  initializeContracts,
  isWalletConnected,
  getConnectedAccount,
  onAccountsChanged,
  onChainChanged
} from './utils/contract';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeModal, setActiveModal] = useState<'deposit' | 'borrow' | 'repay' | 'withdraw' | null>(null);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await isWalletConnected();
      setIsConnected(connected);

      if (connected) {
        const address = await getConnectedAccount();
        setUserAddress(address);
        await initializeContracts();
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const setupEventListeners = () => {
    onAccountsChanged(async (accounts: string[]) => {
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);
        try {
          await initializeContracts();
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing contracts:', error);
        }
      } else {
        setUserAddress(null);
        setIsConnected(false);
        setIsInitialized(false);
      }
    });

    onChainChanged(() => {
      // Reload the page when chain changes
      window.location.reload();
    });
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleOpenModal = (modal: 'deposit' | 'borrow' | 'repay' | 'withdraw') => {
    setActiveModal(modal);
  };

  const handleSuccess = () => {
    // Refresh data after successful transaction
    window.location.reload();
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">DeFi Lending Protocol</h1>
              </div>
              <div className="flex items-center space-x-4">
                {isConnected && userAddress && (
                  <div className="text-sm text-gray-600">
                    Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isConnected ? (
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to DeFi Lending
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to start lending and borrowing
              </p>
              <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Deposit collateral tokens</li>
                  <li>• Borrow against your collateral</li>
                  <li>• Earn interest on deposits</li>
                  <li>• Repay debt with accrued interest</li>
                  <li>• Withdraw collateral when debt-free</li>
                </ul>
              </div>
            </div>
          ) : (
            <LendingDashboard
              isConnected={isConnected}
              userAddress={userAddress}
              onOpenModal={handleOpenModal}
            />
          )}
        </main>

        {/* Modals */}
        <DepositModal
          isOpen={activeModal === 'deposit'}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
        <BorrowModal
          isOpen={activeModal === 'borrow'}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
        <RepayModal
          isOpen={activeModal === 'repay'}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
        <WithdrawModal
          isOpen={activeModal === 'withdraw'}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    </WalletProvider>
  );
}

export default App;
