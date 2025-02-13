import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Wallet } from 'lucide-react';
import assets from '../starknetAssetsMetadata/assets';
import { API_URL } from '../config';

interface BalanceProps {
  userId: string;
  assetSymbol: keyof typeof assets;
  setBalance: (balance: string) => void;
  setBalanceStrk: (balanceStrk: string) => void;
}

const Balance: React.FC<BalanceProps> = ({ userId, assetSymbol = 'ETH', setBalance, setBalanceStrk }) => { 
  const [balance, setBalanceState] = useState<string>('0');
  const [balanceStrk, setBalanceStrkState] = useState<string>('0');
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

        const tokenAddressStrk = assets['STRK'].tokenAddress;
        const responseStrk = await axios.get(
          `${API_URL}/wallets/balance/?tokenAddress=${tokenAddressStrk}&userId=${userId}`
        );
        const currentBalanceStrk = responseStrk.data.balance/Math.pow(10, assets['STRK'].decimals);
        const formattedBalanceStrk = parseFloat(currentBalanceStrk.toString()).toFixed(5);
        setBalanceStrkState(formattedBalanceStrk);
        setBalanceStrk(formattedBalanceStrk);
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

  const balances = [
    { token: assetSymbol, balance },
    { token: 'STRK', balance: balanceStrk }
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Wallet className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600 font-medium">My Tokens</span>
        </div>
      </div>
      <div className="space-y-2">
        {balances.map(({ token, balance }) => (
          <div key={token} 
               className="p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors duration-200"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-100 to-gray-300 flex items-center justify-center">
                  <span className="font-bold text-gray-600">{token[0]}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">{token}</div>
                </div>
              </div>
              <div className="text-md font-medium text-gray-800">{balance}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Balance; 