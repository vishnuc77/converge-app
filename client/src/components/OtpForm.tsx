import React from 'react';

interface OtpFormProps {
  otp: string;
  loading: boolean;
  onOtpChange: (otp: string) => void;
  onSubmit: () => void;
}

const OtpForm: React.FC<OtpFormProps> = ({
  otp,
  loading,
  onOtpChange,
  onSubmit
}) => {
  return (
    <>
      <div>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => onOtpChange(e.target.value)}
          className="w-full max-w-xl mx-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter OTP from email"
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
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </div>
    </>
  );
};

export default OtpForm; 