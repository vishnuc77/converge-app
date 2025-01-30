import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionModal from './TransactionModal';
import TransferModal from './TransferModal';
import SwapModal from './SwapModal';
import { TransactionResponse } from '../types/transactions';
import { API_URL } from '../config';
import MultiTransactionModal from './MultiTransactionModal';

interface AiAgentProps {
  userId: string;
  onTransferSuccess: (txId: string) => void;
  balance: string;
}

const AiAgent: React.FC<AiAgentProps> = ({ userId, onTransferSuccess, balance }) => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [transferDetails, setTransferDetails] = useState<{
    to: string;
    amount: string;
    assetSymbol: string;
  } | null>(null);
  const [swapDetails, setSwapDetails] = useState<{
    fromSymbol: string;
    toSymbol: string;
    amount: string;
  } | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMessage(null);
    try {
      const response = await axios.post(`${API_URL}/wallets/process-prompt`, {
        prompt: searchPrompt,
      });
      if (response.data.message) {
        const transactions = Array.isArray(response.data.message) 
          ? response.data.message 
          : [response.data.message];

        if (transactions.length > 1) {
          setTransaction({ transactions: transactions });
        } else {
          const tx = transactions[0];
          if (tx.name === 'Transfer') {
            const args = JSON.parse(tx.arguments);
            setTransferDetails({
              to: args.destination,
              amount: args.amount.toString(),
              assetSymbol: args.symbol.toUpperCase()
            });
            setShowTransferModal(true);
          } else if (tx.name === 'Swap') {
            console.log('Setting up swap with onTransferSuccess:', onTransferSuccess);
            const args = JSON.parse(tx.arguments);
            setSwapDetails({
              fromSymbol: args.fromSymbol.toUpperCase(),
              toSymbol: args.toSymbol.toUpperCase(),
              amount: args.amount.toString()
            });
            setShowSwapModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error executing prompt:', error);
      setErrorMessage('Something went wrong');
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 10000); // Clear error message after 10 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or errorMessage change
    }
  }, [errorMessage]);

  return (
    <>
      <div className="flex mt-4">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isExecuting) {
                handleExecute();
              }
            }}
            placeholder="Send 1 ETH to 0x123..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px] pr-10"
          />
          {searchPrompt && (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900 transition-colors ${
                isExecuting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isExecuting ? (
                <span className="animate-spin text-white">↻</span>
              ) : (
                <span className="text-white transform rotate-270">↑</span>
              )}
            </button>
          )}
        </div>
      </div>

      {transaction && (
        <MultiTransactionModal
          userId={userId}
          transactions={transaction?.transactions || []}
          onClose={() => setTransaction(null)}
          onSuccess={onTransferSuccess}
          balance={balance}
        />
      )}
      
      {showTransferModal && transferDetails && (
        <TransferModal
          userId={userId}
          onClose={() => setShowTransferModal(false)}
          onTransferSuccess={onTransferSuccess}
          balance={balance}
          initialValues={transferDetails}
        />
      )}
      
      {showSwapModal && swapDetails && (
        <SwapModal
          userId={userId}
          onClose={() => setShowSwapModal(false)}
          onSwapSuccess={onTransferSuccess}
          balance={balance}
          initialValues={swapDetails}
        />
      )}
      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
    </>
  );
};

export default AiAgent; 