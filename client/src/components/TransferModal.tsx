import React, { useState } from 'react';
import { transferTokens } from '../services/transferService';
import assets from '../starknetAssetsMetadata/assets';

interface TransferModalProps {
  userId: string;
  onClose: () => void;
  onTransferSuccess: (txId: string) => void;
  balance: string;
  initialValues?: {
    to: string;
    amount: string;
    assetSymbol: string;
  };
}

const TransferModal: React.FC<TransferModalProps> = ({ userId, onClose, onTransferSuccess, balance, initialValues }) => {
  const [to, setTo] = useState(initialValues?.to || '');
  const [assetSymbol, setAssetSymbol] = useState(initialValues?.assetSymbol || 'ETH');
  const [amount, setAmount] = useState(initialValues?.amount || '');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleTransfer = async () => {
    setIsSending(true);
    try {
      const txId = await transferTokens(userId, to, parseFloat(amount), assetSymbol as keyof typeof assets);
      onTransferSuccess(txId);
      onClose();
    } catch (err) {
      setError('Failed to transfer tokens. Please try again.');
      console.error('Transfer error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Send Tokens</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">To Address</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Asset Symbol</label>
            <input
              type="text"
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            <p className="text-sm text-gray-500 mt-1">Balance: {balance}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="mr-2 bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={isSending}
              className={`bg-gray-800 text-white px-4 py-2 rounded-md ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSending ? 'Sending...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal; 