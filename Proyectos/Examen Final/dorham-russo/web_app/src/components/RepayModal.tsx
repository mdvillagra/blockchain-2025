import React, { useState, useEffect } from 'react';
import { repay, getTokenInfo, getUserPosition, approveToken, getTokenAllowance } from '../utils/contract';
import type { TokenInfo, UserPosition } from '../utils/contract';

interface RepayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RepayModal: React.FC<RepayModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
    const [loanTokenInfo, setLoanTokenInfo] = useState<TokenInfo | null>(null);
    const [allowance, setAllowance] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'approve' | 'repay'>('approve');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [position, tokenInfo, currentAllowance] = await Promise.all([
                getUserPosition(),
                getTokenInfo('loan'),
                getTokenAllowance('loan')
            ]);
            setUserPosition(position);
            setLoanTokenInfo(tokenInfo);
            setAllowance(currentAllowance);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        }
    };

    const handleApprove = async () => {
        if (!userPosition) {
            setError('Unable to load position');
            return;
        }

        const totalAmount = (parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toString();

        setLoading(true);
        setError(null);

        try {
            await approveToken('loan', totalAmount);
            setStep('repay');
            await loadData(); // Refresh allowance
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Approval failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRepay = async () => {
        setLoading(true);
        setError(null);

        try {
            await repay();
            onSuccess();
            onClose();
            setStep('approve');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Repay failed');
        } finally {
            setLoading(false);
        }
    };

    const totalDebt = userPosition
        ? (parseFloat(userPosition.debt) + parseFloat(userPosition.interest)).toFixed(6)
        : '0';

    const needsApproval = parseFloat(totalDebt) > parseFloat(allowance);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Repay Debt</h2>
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

                {userPosition && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Debt Summary</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Principal Debt:</span>
                                <span>{parseFloat(userPosition.debt).toFixed(4)} {loanTokenInfo?.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Accrued Interest:</span>
                                <span>{parseFloat(userPosition.interest).toFixed(4)} {loanTokenInfo?.symbol}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1">
                                <span>Total to Repay:</span>
                                <span>{totalDebt} {loanTokenInfo?.symbol}</span>
                            </div>
                        </div>
                    </div>
                )}

                {loanTokenInfo && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Your Balance</h3>
                        <div className="flex justify-between items-center">
                            <span>Available {loanTokenInfo.symbol}:</span>
                            <span className="font-semibold">{parseFloat(loanTokenInfo.balance).toFixed(4)}</span>
                        </div>
                        {parseFloat(loanTokenInfo.balance) < parseFloat(totalDebt) && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                Insufficient balance. You need {totalDebt} {loanTokenInfo.symbol} to repay your debt.
                            </div>
                        )}
                    </div>
                )}

                {needsApproval && step === 'approve' && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                        <p className="text-sm">
                            You need to approve the protocol to spend your {loanTokenInfo?.symbol} tokens first.
                        </p>
                    </div>
                )}

                <div className="flex space-x-3">
                    {step === 'approve' && needsApproval ? (
                        <button
                            onClick={handleApprove}
                            disabled={loading || parseFloat(loanTokenInfo?.balance || '0') < parseFloat(totalDebt)}
                            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Approving...' : 'Approve'}
                        </button>
                    ) : (
                        <button
                            onClick={handleRepay}
                            disabled={loading || parseFloat(loanTokenInfo?.balance || '0') < parseFloat(totalDebt)}
                            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Repaying...' : 'Repay All Debt'}
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