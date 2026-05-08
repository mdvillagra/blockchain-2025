import React, { useState, useEffect } from 'react';
import { borrow, getTokenInfo, getProtocolInfo, getUserPosition } from '../utils/contract';
import { calculateMaxBorrow, calculateRequiredCollateral } from '../utils/contract';
import type { TokenInfo, ProtocolInfo, UserPosition } from '../utils/contract';

interface BorrowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loanTokenInfo, setLoanTokenInfo] = useState<TokenInfo | null>(null);
    const [protocolInfo, setProtocolInfo] = useState<ProtocolInfo | null>(null);
    const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [tokenInfo, protocol, position] = await Promise.all([
                getTokenInfo('loan'),
                getProtocolInfo(),
                getUserPosition()
            ]);
            setLoanTokenInfo(tokenInfo);
            setProtocolInfo(protocol);
            setUserPosition(position);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        }
    };

    const handleBorrow = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!userPosition || !protocolInfo) {
            setError('Unable to verify position');
            return;
        }

        const maxBorrowable = calculateMaxBorrow(userPosition.collateral, protocolInfo.collateralRatio);
        if (parseFloat(amount) > parseFloat(maxBorrowable)) {
            setError(`Amount exceeds maximum borrowable of ${maxBorrowable} ${loanTokenInfo?.symbol}`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await borrow(amount);
            onSuccess();
            onClose();
            setAmount('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Borrow failed');
        } finally {
            setLoading(false);
        }
    };

    const maxBorrowable = userPosition && protocolInfo
        ? calculateMaxBorrow(userPosition.collateral, protocolInfo.collateralRatio)
        : '0';

    const requiredCollateral = amount && protocolInfo
        ? calculateRequiredCollateral(amount, protocolInfo.collateralRatio)
        : '0';

    const hasEnoughCollateral = userPosition && protocolInfo
        ? parseFloat(userPosition.collateral) >= parseFloat(requiredCollateral)
        : false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Borrow</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Borrow
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            step="0.000001"
                            min="0"
                            max={maxBorrowable}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <div className="absolute right-3 top-2 text-sm text-gray-500">
                            {loanTokenInfo?.symbol}
                        </div>
                    </div>
                    {loanTokenInfo && (
                        <p className="text-sm text-gray-600 mt-1">
                            Available to borrow: {parseFloat(maxBorrowable).toFixed(4)} {loanTokenInfo.symbol}
                        </p>
                    )}
                </div>

                {/* Position Summary */}
                {userPosition && protocolInfo && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Position Summary</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Current Collateral:</span>
                                <span>{parseFloat(userPosition.collateral).toFixed(4)} cUSD</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Required Collateral:</span>
                                <span>{parseFloat(requiredCollateral).toFixed(4)} cUSD</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Interest Rate:</span>
                                <span>{protocolInfo.interestRate}% annually</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Collateral Ratio:</span>
                                <span>{protocolInfo.collateralRatio}%</span>
                            </div>
                        </div>

                        {!hasEnoughCollateral && amount && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                Insufficient collateral. You need at least {parseFloat(requiredCollateral).toFixed(4)} cUSD.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={handleBorrow}
                        disabled={loading || !amount || parseFloat(amount) <= 0 || !hasEnoughCollateral}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Borrowing...' : 'Borrow'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:bg-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}; 