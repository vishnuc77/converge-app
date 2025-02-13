import React, { useState, useEffect } from 'react';
import { Client, Account, ID } from "appwrite";
import TransferModal from './TransferModal';
import SwapModal from './SwapModal';
import Balance from './Balance';
import AiAgent from './AiAgent';
import circuitLogo from '../assets/circuit_logo.svg';
import { AlertCircle, Coins, ArrowLeftRight } from 'lucide-react';

interface WalletInfo {
  email: string;
  address: string;
}

interface WalletProps {
  email: string;
  address: string;
  userId: string;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  setWalletInfo: React.Dispatch<React.SetStateAction<WalletInfo | null>>;
}

const Wallet: React.FC<WalletProps> = ({ email, address, userId, setIsAuthenticated, setUserId, setWalletInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [txLinks, setTxLinks] = useState<string[]>([]);
  const [balanceUpdated, setBalanceUpdated] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [balanceStrk, setBalanceStrk] = useState<string>('0');

  const triggerBalanceUpdate = () => setBalanceUpdated(prev => !prev);

  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_ID);

  const account = new Account(client);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openSwapModal = () => setIsSwapModalOpen(true);
  const closeSwapModal = () => setIsSwapModalOpen(false);

  useEffect(() => {
    if (txLinks.length > 0) {
      const timer = setTimeout(() => setTxLinks([]), 10000);
      return () => clearTimeout(timer);
    }
  }, [txLinks]);

  const handleTransferSuccess = (txId: string | string[]) => {
    const links = Array.isArray(txId) 
      ? txId.map(id => `https://sepolia.starkscan.co/tx/${id}`)
      : [`https://sepolia.starkscan.co/tx/${txId}`];
    setTxLinks(links);
    triggerBalanceUpdate();
  };

  const handleSwapSuccess = (txId: string) => {
    const link = `https://sepolia.starkscan.co/tx/${txId}`;
    setTxLinks([link]);
    triggerBalanceUpdate();
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setIsAuthenticated(false);
      setUserId(null);
      setWalletInfo(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <div className="p-4 text-center space-y-8 w-full max-w-md mx-auto">
        <div className="w-full">
          <Balance 
            userId={userId} 
            assetSymbol="ETH" 
            key={balanceUpdated.toString()} 
            setBalance={setBalance}
            setBalanceStrk={setBalanceStrk}
          />
        </div>
        <div className="flex justify-center gap-8">
          <button
            onClick={openModal}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
          >
            Send
          </button>
          
          <button
            onClick={openSwapModal}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
          >
            Swap
          </button>
        </div>
        <div className="mt-8">
          <AiAgent userId={userId} onTransferSuccess={handleTransferSuccess} balance={balance} balanceStrk={balanceStrk} />
        </div>
        {txLinks.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {txLinks.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline flex items-center gap-1"
              >
                View Transaction {txLinks.length > 1 ? index + 1 : ''} in Explorer
              </a>
            ))}
          </div>
        )}
      </div>
      {isModalOpen && <TransferModal userId={userId} onClose={closeModal} onTransferSuccess={handleTransferSuccess} balance={balance} balanceStrk={balanceStrk} />}
      {isSwapModalOpen && <SwapModal userId={userId} onClose={closeSwapModal} onSwapSuccess={handleSwapSuccess} balance={balance} balanceStrk={balanceStrk} />}
      <div className="space-y-4 mt-16">
        <div className="border border-gray-400 bg-gray-100 p-2 rounded-lg text-sm">
          <div className="text-gray-500 ml-3">
            <div className="flex items-center gap-1 mt-1">
              <Coins className="h-3 w-3" />
              <span>Supported assets: ETH & STRK (More coming soon 🚀)</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Available actions: Transfer & Swap (Expanding soon 🔥)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Wallet; 