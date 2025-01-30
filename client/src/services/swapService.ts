import axios from 'axios';
import { API_URL } from '../config';
import assets from '../starknetAssetsMetadata/assets';

export const fetchSwapQuotes = async (
  userId: string,
  sellAssetSymbol: keyof typeof assets,
  buyAssetSymbol: keyof typeof assets,
  sellAmount: number
): Promise<number> => {
  const processedAmount = sellAmount * Math.pow(10, assets[sellAssetSymbol].decimals);
  const sellTokenAddress = assets[sellAssetSymbol].tokenAddress;
  const buyTokenAddress = assets[buyAssetSymbol].tokenAddress;

  const response = await axios.get(`${API_URL}/wallets/swap-quotes`, {
    params: {
      userId,
      sellTokenAddress,
      buyTokenAddress,
      sellAmount: processedAmount,
    }
  });

  const buyAmount = parseFloat(response.data.buyAmount) / Math.pow(10, assets[buyAssetSymbol].decimals);

  return buyAmount;
};

export const executeSwap = async (
    userId: string,
    sellAssetSymbol: keyof typeof assets,
    buyAssetSymbol: keyof typeof assets,
    sellAmount: number
  ): Promise<string> => {
    const processedAmount = sellAmount * Math.pow(10, assets[sellAssetSymbol].decimals);
    const sellTokenAddress = assets[sellAssetSymbol].tokenAddress;
    const buyTokenAddress = assets[buyAssetSymbol].tokenAddress;
  
    const response = await axios.post(`${API_URL}/wallets/swap`, {
      userId,
      sellTokenAddress,
      buyTokenAddress,
      sellAmount: processedAmount,
    });

  
    return response.data.txId;
  };