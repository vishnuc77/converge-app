export type TransferArgs = {
  destination: string;
  amount: number;
  symbol: string;
};

export type SwapArgs = {
  fromSymbol: string;
  toSymbol: string;
  amount: number;
};

export interface TransactionResponse {
  transactions?: {
    name: 'Transfer' | 'Swap';
    arguments: string;
  }[];
} 