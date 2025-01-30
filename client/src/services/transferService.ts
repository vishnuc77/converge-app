import axios from 'axios';
import { API_URL } from '../config';
import assets from '../starknetAssetsMetadata/assets';

export const transferTokens = async (
  userId: string,
  to: string,
  amount: number,
  assetSymbol: keyof typeof assets
): Promise<string> => {
  const processedAmount = amount * Math.pow(10, assets[assetSymbol].decimals);
  const tokenAddress = assets[assetSymbol].tokenAddress;
  const response = await axios.post(`${API_URL}/wallets/transfer`, {
    userId,
    to,
    amount: processedAmount,
    tokenAddress,
  });

  return response.data.txId;
}; 