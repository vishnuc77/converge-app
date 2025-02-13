import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { fetchSwapQuotes } from '../services/swapService';
import assets from '../starknetAssetsMetadata/assets';

interface SwapFormProps {
  userId: string;
  balance: string;
  balanceStrk: string;
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
  balanceStrk,
  initialValues,
  onError,
  onChange,
}) => {
  const [fromAmount, setFromAmount] = useState(initialValues?.amount || '');
  const [fromToken, setFromToken] = useState(initialValues?.fromSymbol || 'ETH');
  const [toAmount, setToAmount] = useState('');
  const [toToken, setToToken] = useState(initialValues?.toSymbol || 'STRK');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  useEffect(() => {
    if (initialValues?.amount) {
      fetchQuote(initialValues.amount, initialValues.fromSymbol, initialValues.toSymbol);
    }
  }, []);

  const fetchQuoteImmediate = async (newAmount: string, currentFromToken: string, currentToToken: string) => {
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      setToAmount('');
      return;
    }

    setIsLoadingQuote(true);
    try {
      const buyAmount = await fetchSwapQuotes(
        userId,
        currentFromToken as keyof typeof assets,
        currentToToken as keyof typeof assets,
        Number(newAmount)
      );
      const truncatedBuyAmount = (Math.floor(Number(buyAmount) * 1_000_000) / 1_000_000).toString();
      setToAmount(truncatedBuyAmount || '');
      onChange({ fromAmount: newAmount, fromToken: currentFromToken, toAmount: truncatedBuyAmount, toToken: currentToToken });
    } catch (err) {
      console.error('Failed to fetch quote:', err);
      onError('Failed to fetch swap quote');
      setToAmount('');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const fetchQuote = useCallback(
    debounce((newAmount: string, currentFromToken: string, currentToToken: string) => {
      fetchQuoteImmediate(newAmount, currentFromToken, currentToToken);
    }, 1000),
    [userId, onChange]
  );

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setFromAmount(newAmount);
    fetchQuote(newAmount, fromToken, toToken);
    onChange({ fromAmount: newAmount, fromToken, toAmount, toToken });
  };

  const handleTokenChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFromToken(value);
      setToToken(value === 'ETH' ? 'STRK' : 'ETH');
      onChange({ fromAmount, fromToken: value, toAmount, toToken: value === 'ETH' ? 'STRK' : 'ETH' });
      if (fromAmount) {
        fetchQuote(fromAmount, value, value === 'ETH' ? 'STRK' : 'ETH');
      }
    } else {
      setToToken(value);
      setFromToken(value === 'ETH' ? 'STRK' : 'ETH');
      onChange({ fromAmount, fromToken: value === 'ETH' ? 'STRK' : 'ETH', toAmount, toToken: value });
      if (fromAmount) {
        fetchQuote(fromAmount, fromToken, value);
      }
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
            <select
              value={fromToken}
              onChange={(e) => handleTokenChange('from', e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="ETH">ETH</option>
              <option value="STRK">STRK</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex gap-4">
            <p className="text-sm text-gray-500 mt-1">Balance: {fromToken === 'ETH' ? balance : balanceStrk}</p>
          </div>
        </div>
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
            <select
              value={toToken}
              onChange={(e) => handleTokenChange('to', e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="ETH">ETH</option>
              <option value="STRK">STRK</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapForm; 