import React, { useState } from 'react';
import SwapForm from './SwapForm';
import TransferForm from './TransferForm';
import { executeSwap } from '../services/swapService';
import { transferTokens } from '../services/transferService';
import assets from '../starknetAssetsMetadata/assets';
import { SwapArgs, TransferArgs } from '../types/transactions';

interface Transaction {
  name: 'Swap' | 'Transfer';
  arguments: SwapArgs | TransferArgs;
}

interface MultiTransactionModalProps {
  userId: string;
  transactions: Transaction[];
  onClose: () => void;
  onSuccess: (txId: string) => void;
  balance: string;
}

const MultiTransactionModal: React.FC<MultiTransactionModalProps> = ({
  userId,
  transactions,
  onClose,
  onSuccess,
  balance,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [swapValues, setSwapValues] = useState<any>(null);
  const [transferValues, setTransferValues] = useState<any>(null);

  const handleConfirmAll = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      for (const tx of transactions) {
        if (tx.name === 'Swap') {
          const txId = await executeSwap(
            userId,
            swapValues.fromToken as keyof typeof assets,
            swapValues.toToken as keyof typeof assets,
            parseFloat(swapValues.fromAmount)
          );
          onSuccess(txId);
        } else if (tx.name === 'Transfer') {
          const txId = await transferTokens(
            userId,
            transferValues.to,
            parseFloat(transferValues.amount),
            transferValues.assetSymbol as keyof typeof assets
          );
          onSuccess(txId);
        }
      }
      onClose();
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to process transactions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Confirm Transactions</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}

          {transactions.map((tx, index) => {
            const args = JSON.parse(tx.arguments);
            return (
              <div key={index} className="mb-6">
                <h3 className="font-medium mb-3">{tx.name}</h3>
                {tx.name === 'Swap' && (
                  <SwapForm
                    userId={userId}
                    balance={balance}
                    initialValues={{
                      fromSymbol: args.fromSymbol,
                      toSymbol: args.toSymbol,
                      amount: args.amount.toString(),
                    }}
                    onError={setError}
                    onChange={setSwapValues}
                  />
                )}
                {tx.name === 'Transfer' && (
                  <TransferForm
                    balance={balance}
                    initialValues={{
                      to: args.destination,
                      amount: args.amount.toString(),
                      assetSymbol: args.symbol,
                    }}
                    onChange={setTransferValues}
                  />
                )}
                {index < transactions.length - 1 && <hr className="my-4" />}
              </div>
            );
          })}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAll}
              disabled={isProcessing}
              className={`bg-gray-800 text-white px-4 py-2 rounded-md ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Confirm All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiTransactionModal; 