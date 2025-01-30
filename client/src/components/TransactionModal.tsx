import React, { useState } from 'react';
import { TransferArgs, SwapArgs, TransactionResponse } from '../types/transactions';
import { transferTokens } from '../services/transferService';
import { executeSwap } from '../services/swapService';
interface TransactionModalProps {
  transaction: TransactionResponse;
  onClose: () => void;
  onConfirm: (txId: string) => void;
  userId: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onConfirm, userId }) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const args = JSON.parse(transaction.arguments);

  const handleTransfer = async (transferArgs: TransferArgs) => {
    setIsSending(true);
    setError(null);
    try {
      const txId = await transferTokens(
        userId,
        transferArgs.destination,
        transferArgs.amount,
        transferArgs.symbol as 'ETH' | 'STRK'
      );
      console.log('Transfer successful, txId:', txId);
      onConfirm(txId);
    } catch (err) {
      console.error('Transfer error:', err);
      setError('Failed to transfer tokens. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const renderContent = () => {
    if (transaction.name === 'Transfer') {
      let transferArgs = args as TransferArgs;
      transferArgs.symbol = transferArgs.symbol.toUpperCase();
      return (
        <div className="space-y-4">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-50 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-center text-gray-800">Confirm Transfer</h3>
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Recipient Address</p>
              <p className="font-mono text-gray-700 truncate overflow-hidden">{formatAddress(transferArgs.destination)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1 text-center">Amount</p>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-800">{transferArgs.amount}</span>
                <span className="ml-2 text-gray-600">{transferArgs.symbol}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="bg-gray-500 px-4 py-2 text-white hover:text-gray-800 font-medium rounded-lg hover:bg-gray-500 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => handleTransfer(transferArgs)}
              disabled={isSending}
              className={`px-6 py-2 font-medium rounded-lg transform transition-all duration-150 hover:shadow-md active:scale-95 ${
                isSending ? 'bg-blue-700 text-white opacity-50 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-700'
              }`}
            >
              {isSending ? 'Sending...' : 'Confirm'}
            </button>
          </div>
        </div>
      );
    } else if (transaction.name === 'Swap') {
      console.log('Not implemented');
      let swapArgs = args as SwapArgs;
      swapArgs.fromSymbol = swapArgs.fromSymbol.toUpperCase();
      swapArgs.toSymbol = swapArgs.toSymbol.toUpperCase();
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-50 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-center text-gray-800">Confirm Swap</h3>
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1 text-center">From</p>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-800">{swapArgs.amount}</span>
                <span className="ml-2 text-gray-600">{swapArgs.fromSymbol}</span>
              </div>
            </div>
            <div className="flex justify-center my-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1 text-center">To</p>
              <p className="text-lg font-medium text-gray-700 text-center">{swapArgs.toSymbol}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center space-y-2">
            <p className="text-red-500">Not implemented</p>
            <button
              onClick={onClose}
              className="bg-gray-500 px-4 py-2 text-white hover:text-gray-800 font-medium rounded-lg hover:bg-gray-500 transition-colors duration-150"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="max-h-[80vh] overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TransactionModal; 