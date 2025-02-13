import React, { useState } from 'react';
import { executeSwap } from '../services/swapService';
import assets from '../starknetAssetsMetadata/assets';
import SwapForm from './SwapForm';

interface SwapModalProps {
  userId: string;
  onClose: () => void;
  onSwapSuccess: (txId: string) => void;
  balance: string;
  initialValues?: {
    fromSymbol: string;
    toSymbol: string;
    amount: string;
  };
  balanceStrk: string;
}

const SwapModal: React.FC<SwapModalProps> = ({ userId, onClose, onSwapSuccess, balance, balanceStrk, initialValues }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [swapValues, setSwapValues] = useState<{
    fromAmount: string;
    fromToken: string;
    toAmount: string;
    toToken: string;
  }>({
    fromAmount: initialValues?.amount || '',
    fromToken: initialValues?.fromSymbol || 'ETH',
    toAmount: '',
    toToken: initialValues?.toSymbol || 'STRK'
  });

  const handleSwap = async () => {
    setIsSending(true);
    try {
      console.log(swapValues);
      const txId = await executeSwap(
        userId,
        swapValues.fromToken as keyof typeof assets,
        swapValues.toToken as keyof typeof assets,
        parseFloat(swapValues.fromAmount)
      );
      console.log('txId', txId);
      onSwapSuccess(txId);
      onClose();
    } catch (err) {
      setError('Failed to swap tokens. Please try again.');
      console.error('Swap error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Swap Tokens</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          
          <SwapForm
            userId={userId}
            balance={balance}
            balanceStrk={balanceStrk}
            initialValues={initialValues}
            onError={setError}
            onChange={setSwapValues}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSwap}
              disabled={isSending}
              className={`bg-gray-800 text-white px-4 py-2 rounded-md ${
                isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'
              }`}
            >
              {isSending ? 'Swapping...' : 'Swap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapModal; 