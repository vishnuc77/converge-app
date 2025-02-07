import React from 'react';

interface EmailFormProps {
  email: string;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}

const EmailForm: React.FC<EmailFormProps> = ({
  email,
  loading,
  onEmailChange,
  onSubmit
}) => {
  return (
    <>
      <div>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full max-w-xl mx-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>
      
      <div className="mt-4">
        <button
          onClick={onSubmit}
          disabled={loading}
          className={`bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gray-800 hover:bg-gray-900'
          } text-white`}
        >
          {loading ? 'Sending...' : 'Register'}
        </button>
      </div>
    </>
  );
};

export default EmailForm; 