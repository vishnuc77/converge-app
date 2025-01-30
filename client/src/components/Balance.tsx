import React, { useEffect, useState } from 'react';
import axios from 'axios';
import assets from '../starknetAssetsMetadata/assets';
import { API_URL } from '../config';

interface BalanceProps {
  userId: string;
  assetSymbol: keyof typeof assets;
  setBalance: (balance: string) => void;
}

const Balance: React.FC<BalanceProps> = ({ userId, assetSymbol = 'ETH', setBalance }) => { 
  const [balance, setBalanceState] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const tokenAddress = assets[assetSymbol].tokenAddress;
        const response = await axios.get(
          `${API_URL}/wallets/balance/?tokenAddress=${tokenAddress}&userId=${userId}`
        );
        const currentBalance = response.data.balance/Math.pow(10, assets['ETH'].decimals);
        const formattedBalance = parseFloat(currentBalance.toString()).toFixed(5);
        setBalance(formattedBalance);
        setBalanceState(formattedBalance);
      } catch (err) {
        setError('Failed to fetch balance');
        console.error('Error fetching balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [userId, assetSymbol]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h3 className="text-gray-500 text-sm mb-1">Balance</h3>
      <p className="text-2xl font-semibold text-gray-900 flex items-center">
        {balance} {assetSymbol}
      </p>
    </div>
  );
};

export default Balance; 