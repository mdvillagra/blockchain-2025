import React, { useState, useEffect } from 'react';
import { approveToken, getTokenInfo, getTokenAllowance, depositCollateral } from '../utils/contract';
import type { TokenInfo } from '../utils/contract';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [collateralTokenInfo, setCollateralTokenInfo] = useState<TokenInfo | null>(null);
    const [allowance, setAllowance] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'approve' | 'deposit'>('approve');

    useEffect(() => {
        if (isOpen) {
            loadTokenInfo();
        }
    }, [isOpen]);

    const loadTokenInfo = async () => {
        try {
            const [tokenInfo, currentAllowance] = await Promise.all([
                getTokenInfo('collateral'),
                getTokenAllowance('collateral')
            ]);
            setCollateralTokenInfo(tokenInfo);
            setAllowance(currentAllowance);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load token info');
        }
    };

    const handleApprove = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        console.log('Approving amount:', amount);
        console.log('Amount as float:', parseFloat(amount));

        setLoading(true);
        setError(null);

        try {
            await approveToken('collateral', amount);
            setStep('deposit');
            await loadTokenInfo(); // Refresh allowance
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Approval failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await depositCollateral(amount);
            onSuccess();
            onClose();
            setAmount('');
            setStep('approve');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Deposit failed');
        } finally {
            setLoading(false);
        }
    };

    const needsApproval = parseFloat(amount) > parseFloat(allowance);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Deposit Collateral</h2>
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
                        Amount to Deposit
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                console.log('Input changed to:', e.target.value);
                                setAmount(e.target.value);
                            }}
                            placeholder="0.0"
                            step="0.000001"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <div className="absolute right-3 top-2 text-sm text-gray-500">
                            {collateralTokenInfo?.symbol}
                        </div>
                    </div>
                    {collateralTokenInfo && (
                        <p className="text-sm text-gray-600 mt-1">
                            Available: {parseFloat(collateralTokenInfo.balance).toFixed(4)} {collateralTokenInfo.symbol}
                        </p>
                    )}
                </div>

                {needsApproval && step === 'approve' && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                        <p className="text-sm">
                            You need to approve the protocol to spend your {collateralTokenInfo?.symbol} tokens first.
                        </p>
                    </div>
                )}

                <div className="flex space-x-3">
                    {step === 'approve' && needsApproval ? (
                        <button
                            onClick={handleApprove}
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Approving...' : 'Approve'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDeposit}
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Depositing...' : 'Deposit'}
                        </button>
                    )}
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