import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { fetchSwapQuotes } from '../services/swapService';
import assets from '../starknetAssetsMetadata/assets';

interface SwapFormProps {
  userId: string;
  balance: string;
  initialValues?: {
    fromSymbol: string;
    toSymbol: string;
    amount: string;
  };
  onError: (error: string | null) => void;
  onChange: (values: {
    fromAmount: string;
    fromToken: string;
    toAmount: string;
    toToken: string;
  }) => void;
}

const SwapForm: React.FC<SwapFormProps> = ({
  userId,
  balance,
  initialValues,
  onError,
  onChange,
}) => {
  const [fromAmount, setFromAmount] = useState(initialValues?.amount || '');
  const [fromToken, setFromToken] = useState(initialValues?.fromSymbol || 'ETH');
  const [toAmount, setToAmount] = useState('');
  const [toToken, setToToken] = useState(initialValues?.toSymbol || 'STRK');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const fetchQuote = useCallback(
    debounce(async (newAmount: string) => {
      if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
        setToAmount('');
        return;
      }

      setIsLoadingQuote(true);
      try {
        const buyAmount = await fetchSwapQuotes(
          userId,
          fromToken as keyof typeof assets,
          toToken as keyof typeof assets,
          Number(newAmount)
        );
        setToAmount(buyAmount.toString() || '');
        console.log('fromAmount', fromAmount);
        onChange({ fromAmount: newAmount, fromToken, toAmount: buyAmount.toString(), toToken });
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        onError('Failed to fetch swap quote');
        setToAmount('');
      } finally {
        setIsLoadingQuote(false);
      }
    }, 1000),
    [userId, fromToken, toToken, onChange]
  );

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setFromAmount(newAmount);
    fetchQuote(newAmount);
    console.log('fromAmount', fromAmount);
    onChange({ fromAmount: newAmount, fromToken, toAmount, toToken });
  };

  const handleTokenChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFromToken(value);
      onChange({ fromAmount, fromToken: value, toAmount, toToken });
    } else {
      setToToken(value);
      onChange({ fromAmount, fromToken, toAmount, toToken: value });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={fromAmount}
              onChange={handleFromAmountChange}
              placeholder="0.0"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={fromToken}
              onChange={(e) => handleTokenChange('from', e.target.value)}
              placeholder="Token"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Balance: {balance}</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={isLoadingQuote ? 'Loading...' : toAmount}
              disabled
              placeholder="0.0"
              className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={toToken}
              onChange={(e) => handleTokenChange('to', e.target.value)}
              placeholder="Token"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapForm; 