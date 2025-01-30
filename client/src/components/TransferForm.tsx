import React, { useState } from 'react';

interface TransferFormProps {
  balance: string;
  initialValues?: {
    to: string;
    amount: string;
    assetSymbol: string;
  };
  onChange: (values: {
    to: string;
    amount: string;
    assetSymbol: string;
  }) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({
  balance,
  initialValues,
  onChange,
}) => {
  const [to, setTo] = useState(initialValues?.to || '');
  const [assetSymbol, setAssetSymbol] = useState(initialValues?.assetSymbol || 'ETH');
  const [amount, setAmount] = useState(initialValues?.amount || '');

  const handleChange = (field: string, value: string) => {
    let newValues = { to, amount, assetSymbol };
    switch (field) {
      case 'to':
        setTo(value);
        newValues.to = value;
        break;
      case 'amount':
        setAmount(value);
        newValues.amount = value;
        break;
      case 'assetSymbol':
        setAssetSymbol(value);
        newValues.assetSymbol = value;
        break;
    }
    onChange(newValues);
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">To Address</label>
        <input
          type="text"
          value={to}
          onChange={(e) => handleChange('to', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Asset Symbol</label>
        <input
          type="text"
          value={assetSymbol}
          onChange={(e) => handleChange('assetSymbol', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
        <p className="text-sm text-gray-500 mt-1">Balance: {balance}</p>
      </div>
    </div>
  );
};

export default TransferForm; 