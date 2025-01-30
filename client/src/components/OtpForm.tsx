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
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP
        </label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => onOtpChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter OTP from email"
          disabled={loading}
        />
      </div>
      
      <button
        onClick={onSubmit}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
          loading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
    </>
  );
};

export default OtpForm; 