import React, { useState, useEffect } from 'react';
import SwapForm from './SwapForm';
import TransferForm from './TransferForm';
import { executeSwap } from '../services/swapService';
import { transferTokens } from '../services/transferService';
import assets from '../starknetAssetsMetadata/assets';
import { SwapArgs, TransferArgs } from '../types/transactions';

interface Transaction {
  name: 'Swap' | 'Transfer';
  arguments: string;
}

interface MultiTransactionModalProps {
  userId: string;
  transactions: Transaction[];
  onClose: () => void;
  onSuccess: (txId: string[]) => void;
  balance: string;
  balanceStrk: string;
}

const MultiTransactionModal: React.FC<MultiTransactionModalProps> = ({
  userId,
  transactions,
  onClose,
  onSuccess,
  balance,
  balanceStrk
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [swapValues, setSwapValues] = useState<any>(null);
  const [transferValues, setTransferValues] = useState<any>(null);
  const [dependentValues, setDependentValues] = useState<Record<number, string>>({});

  const handleConfirmAll = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const txId1 = await executeSwap(
        userId,
        swapValues.fromToken.toUpperCase() as keyof typeof assets,
        swapValues.toToken.toUpperCase() as keyof typeof assets,
        parseFloat(swapValues.fromAmount)
      );
      
      // Add 10 second delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const txId2 = await transferTokens(
        userId,
        transferValues.to,
        parseFloat(transferValues.amount),
        transferValues.assetSymbol.toUpperCase() as keyof typeof assets
      );

      // Pass both transaction IDs to onSuccess
      onSuccess([txId1, txId2]);
        
      onClose();
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to process transactions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add logging to track values
  const handleSwapChange = (index: number, values: any) => {
    setSwapValues(values);
    
    if (values.toAmount) {
      setDependentValues(prev => {
        const newValues = {
          ...prev,
          [index + 1]: values.toAmount
        };
        return newValues;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Confirm Transactions</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}

          {transactions.map((tx, index) => {
            if (tx.name === 'Swap') {
              const args: SwapArgs = JSON.parse(tx.arguments)

              return (
                <div key={index} className="mb-6">
                  <h3 className="font-medium mb-3">{tx.name}</h3>
                  <SwapForm
                    userId={userId}
                    balance={balance}
                    balanceStrk={balanceStrk}
                    initialValues={{
                      fromSymbol: args.fromSymbol.toUpperCase(),
                      toSymbol: args.toSymbol.toUpperCase(),
                      amount: args.amount.toString(),
                    }}
                    onError={setError}
                    onChange={(values) => handleSwapChange(index, values)}
                  />
                  {index < transactions.length - 1 && <hr className="my-4" />}
                </div>
              );
            } else if (tx.name === 'Transfer') {
              const args: TransferArgs = JSON.parse(tx.arguments)
              const swapOutputAmount = dependentValues[index];

              return (
                <div key={index} className="mb-6">
                  <h3 className="font-medium mb-3">{tx.name}</h3>
                  <TransferForm
                    key={`transfer-${swapOutputAmount}`}
                    balance={balance}
                    initialValues={{
                      ...args,
                      to: args.destination,
                      amount: swapOutputAmount || args.amount.toString(),
                      assetSymbol: args.symbol.toUpperCase(),
                    }}
                    onChange={setTransferValues}
                  />
                  {index < transactions.length - 1 && <hr className="my-4" />}
                </div>
              );
            }
            return null;
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