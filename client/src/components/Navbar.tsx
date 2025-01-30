import React from 'react';
import circuitLogo from '../assets/circuit_logo.svg';

interface NavbarProps {
  email?: string;
  address?: string;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ email, address, onLogout }) => {
  return (
    <div className="w-full bg-white shadow-md py-4 fixed top-0 left-0 z-50">
      <div className="flex justify-between items-center px-4 md:pl-4 md:pr-8">
        <div className="flex items-center gap-2">
          <img src={circuitLogo} alt="Circuit Logo" className="w-14 h-14" />
          <h1 className="text-4xl font-bold text-black-500">
            Converge
          </h1>
        </div>
        
        {email && address && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,4H4C2.895,4,2,4.895,2,6v12c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V6C22,4.895,21.105,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z"/>
              </svg>
              <p className="text-sm font-mono bg-gray-50 px-3 py-1 rounded">{email}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono bg-gray-50 px-3 py-1 rounded truncate">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <button 
                onClick={() => navigator.clipboard.writeText(address)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z" />
                  <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={onLogout}
              className="bg-red-400 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar; 