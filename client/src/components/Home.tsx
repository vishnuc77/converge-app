import React, { useState, useEffect } from 'react';
import { Client, Account, ID } from "appwrite";
import EmailForm from './EmailForm';
import OtpForm from './OtpForm';
import axios from 'axios';
import Wallet from './Wallet';
import { API_URL } from '../config';
import Navbar from './Navbar';

interface WalletInfo {
  email: string;
  address: string;
}

const Home = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_ID);

  const account = new Account(client);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      setUserId(user.$id);
      setIsAuthenticated(true);

      // Get user's email from Appwrite session
      const session = await account.getSession('current');
      const userEmail = session.providerUid;
      setEmail(userEmail);

      // Only try to get wallet if user is authenticated
      try {
        const response = await axios.get(`${API_URL}/wallets/${user.$id}`);
        setWalletInfo(response.data);
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserId(null);
      setWalletInfo(null);
    } finally {
      setLoading(false);
      setIsPageLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const sessionToken = await account.createEmailToken(
        ID.unique(),
        email
      );

      setUserId(sessionToken.userId);
      setSuccess(true);
      setShowOtpField(true);
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp || !userId) {
      setError('Please enter the OTP received in your email');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create session with OTP
      await account.createSession(
        userId,
        otp
      );

      setIsAuthenticated(true);

      // Try to get existing wallet
      try {
        const response = await axios.get(`${API_URL}/wallets/${userId}`);
        setWalletInfo(response.data);
        console.log(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Wallet doesn't exist, create new one
          const createResponse = await axios.post(
            `${API_URL}/wallets`,
            { 
              email: email,
              appwriteUserId: userId 
            }
          );
          setWalletInfo(createResponse.data);
          console.log(createResponse.data);
        } else {
          // Handle other errors
          console.error('Error with wallet:', error);
          setError('Error setting up wallet. Please try again.');
        }
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      console.error('OTP verification error:', err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    setError(null);
    setSuccess(false);
  };

  const handleOtpChange = (newOtp: string) => {
    setOtp(newOtp);
    setError(null);
  };

  if (isPageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-200 pt-24">
      <Navbar 
        email={walletInfo?.email}
        address={walletInfo?.address}
        onLogout={isAuthenticated ? () => setIsAuthenticated(false) : undefined}
      />
      
      <div className="flex flex-col items-center">
        {isAuthenticated && walletInfo ? (
          <Wallet
            email={walletInfo.email}
            address={walletInfo.address}
            userId={userId!}
            setIsAuthenticated={setIsAuthenticated}
            setUserId={setUserId}
            setWalletInfo={setWalletInfo}
          />
        ) : (
          <>
            {error && (
              <div className="text-red-500 text-sm rounded-md p-2 bg-red-50">
                {error}
              </div>
            )}

            {!showOtpField ? (
              <EmailForm
                email={email}
                loading={loading}
                onEmailChange={handleEmailChange}
                onSubmit={handleRegister}
              />
            ) : (
              <OtpForm
                otp={otp}
                loading={loading}
                onOtpChange={handleOtpChange}
                onSubmit={handleOtpSubmit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home; 