import React, { useState, useEffect } from 'react';
import {
    getUserPosition,
    getProtocolInfo,
    getTokenInfo,
    shortenAddress,
    calculateMaxBorrow,
    calculateRequiredCollateral
} from '../utils/contract';
import type { UserPosition, ProtocolInfo, TokenInfo } from '../utils/contract';

interface LendingDashboardProps {
    isConnected: boolean;
    userAddress: string | null;
    onOpenModal?: (modal: 'deposit' | 'borrow' | 'repay' | 'withdraw') => void;
}

export const LendingDashboard: React.FC<LendingDashboardProps> = ({ isConnected, userAddress, onOpenModal }) => {
    const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
    const [protocolInfo, setProtocolInfo] = useState<ProtocolInfo | null>(null);
    const [collateralTokenInfo, setCollateralTokenInfo] = useState<TokenInfo | null>(null);
    const [loanTokenInfo, setLoanTokenInfo] = useState<TokenInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        if (!isConnected) return;

        setLoading(true);
        setError(null);

        try {
            const [position, protocol, collateral, loan] = await Promise.all([
                getUserPosition(),
                getProtocolInfo(),
                getTokenInfo('collateral'),
                getTokenInfo('loan')
            ]);

            setUserPosition(position);
            setProtocolInfo(protocol);
            setCollateralTokenInfo(collateral);
            setLoanTokenInfo(loan);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isConnected]);

    const maxBorrowable = userPosition && protocolInfo
        ? calculateMaxBorrow(userPosition.collateral, protocolInfo.collateralRatio)
        : '0';

    const totalDebt = userPosition
        ? (parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toFixed(6)
        : '0';

    const healthFactor = userPosition && protocolInfo && parseFloat(userPosition.debt) > 0
        ? (parseFloat(userPosition.collateral) * 100 / (parseFloat(userPosition.debt) * protocolInfo.collateralRatio)).toFixed(2)
        : '∞';

    if (!isConnected) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">Please connect your wallet to view your lending position</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your position...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={loadData}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* User Address */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-2">Connected Wallet</h3>
                <p className="text-gray-600 font-mono">{userAddress ? shortenAddress(userAddress) : 'Unknown'}</p>
            </div>

            {/* Protocol Info */}
            {protocolInfo && (
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-4">Protocol Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Interest Rate</p>
                            <p className="font-semibold">{protocolInfo.interestRate}% annually</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Collateral Ratio</p>
                            <p className="font-semibold">{protocolInfo.collateralRatio}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Protocol Liquidity</p>
                            <p className="font-semibold">{parseFloat(protocolInfo.protocolLiquidity).toFixed(2)} {loanTokenInfo?.symbol}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Collateral Token</p>
                            <p className="font-semibold">{shortenAddress(protocolInfo.collateralTokenAddress)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Token Balances */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Token Balances</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collateralTokenInfo && (
                        <div className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{collateralTokenInfo.name} ({collateralTokenInfo.symbol})</h4>
                                <span className="text-sm text-gray-600">Collateral</span>
                            </div>
                            <p className="text-2xl font-bold">{parseFloat(collateralTokenInfo.balance).toFixed(4)}</p>
                            <p className="text-sm text-gray-600">Available: {parseFloat(collateralTokenInfo.balance).toFixed(4)}</p>
                        </div>
                    )}
                    {loanTokenInfo && (
                        <div className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{loanTokenInfo.name} ({loanTokenInfo.symbol})</h4>
                                <span className="text-sm text-gray-600">Loan</span>
                            </div>
                            <p className="text-2xl font-bold">{parseFloat(loanTokenInfo.balance).toFixed(4)}</p>
                            <p className="text-sm text-gray-600">Available: {parseFloat(loanTokenInfo.balance).toFixed(4)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Position */}
            {userPosition && (
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-4">Your Position</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Deposited Collateral</p>
                            <p className="font-semibold">{parseFloat(userPosition.collateral).toFixed(4)} {collateralTokenInfo?.symbol}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Outstanding Debt</p>
                            <p className="font-semibold">{parseFloat(userPosition.debt).toFixed(4)} {loanTokenInfo?.symbol}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Accrued Interest</p>
                            <p className="font-semibold">{parseFloat(userPosition.interest).toFixed(4)} {loanTokenInfo?.symbol}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Debt</p>
                            <p className="font-semibold">{totalDebt} {loanTokenInfo?.symbol}</p>
                        </div>
                    </div>

                    {/* Health Factor */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Health Factor</span>
                            <span className={`font-semibold ${parseFloat(healthFactor) < 1.5 ? 'text-red-600' : 'text-green-600'}`}>
                                {healthFactor}
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${parseFloat(healthFactor) < 1.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(parseFloat(healthFactor) * 50, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Max Borrowable */}
                    {parseFloat(userPosition.collateral) > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-600">Maximum Borrowable</p>
                            <p className="font-semibold">{maxBorrowable} {loanTokenInfo?.symbol}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => onOpenModal?.('deposit')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                        Deposit Collateral
                    </button>
                    <button
                        onClick={() => onOpenModal?.('borrow')}
                        disabled={parseFloat(userPosition?.collateral || '0') === 0}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Borrow
                    </button>
                    <button
                        onClick={() => onOpenModal?.('repay')}
                        disabled={parseFloat(userPosition?.debt || '0') === 0}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Repay Debt
                    </button>
                    <button
                        onClick={() => onOpenModal?.('withdraw')}
                        disabled={parseFloat(userPosition?.debt || '0') > 0 || parseFloat(userPosition?.collateral || '0') === 0}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Withdraw Collateral
                    </button>
                </div>
            </div>
        </div>
    );
}; 