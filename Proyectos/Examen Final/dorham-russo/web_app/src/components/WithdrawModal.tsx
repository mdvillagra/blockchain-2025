import React, { useState, useEffect } from 'react';
import { withdrawCollateral, getUserPosition, getTokenInfo } from '../utils/contract';
import type { UserPosition, TokenInfo } from '../utils/contract';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
    const [collateralTokenInfo, setCollateralTokenInfo] = useState<TokenInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [position, tokenInfo] = await Promise.all([
                getUserPosition(),
                getTokenInfo('collateral')
            ]);
            setUserPosition(position);
            setCollateralTokenInfo(tokenInfo);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        }
    };

    const handleWithdraw = async () => {
        setLoading(true);
        setError(null);

        try {
            await withdrawCollateral();
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Withdraw failed');
        } finally {
            setLoading(false);
        }
    };

    const canWithdraw = userPosition && parseFloat(userPosition.debt) === 0 && parseFloat(userPosition.collateral) > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Withdraw Collateral</h2>
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
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Position Summary</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Deposited Collateral:</span>
                                <span>{parseFloat(userPosition.collateral).toFixed(4)} {collateralTokenInfo?.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Outstanding Debt:</span>
                                <span>{parseFloat(userPosition.debt).toFixed(4)} {collateralTokenInfo?.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Accrued Interest:</span>
                                <span>{parseFloat(userPosition.interest).toFixed(4)} {collateralTokenInfo?.symbol}</span>
                            </div>
                        </div>
                    </div>
                )}

                {!canWithdraw && userPosition && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        <p className="text-sm">
                            {parseFloat(userPosition.debt) > 0
                                ? 'You cannot withdraw collateral while you have outstanding debt. Please repay your debt first.'
                                : 'No collateral to withdraw.'
                            }
                        </p>
                    </div>
                )}

                {canWithdraw && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Withdrawal Summary</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Amount to Withdraw:</span>
                                <span className="font-semibold">{parseFloat(userPosition.collateral).toFixed(4)} {collateralTokenInfo?.symbol}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                This will withdraw all your deposited collateral. Make sure you want to close your position.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={handleWithdraw}
                        disabled={loading || !canWithdraw}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Withdrawing...' : 'Withdraw All Collateral'}
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