import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const TwitterAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('initial'); // initial, credentials, processing, success, error
  const [requestId, setRequestId] = useState(null);
  const [error, setError] = useState(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen && step === 'initial') {
      startAuth();
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [isOpen]);

  const startAuth = async () => {
    try {
      setError(null);
      const response = await authService.startTwitterAuth();
      setRequestId(response.request_id);
      setStep('credentials');
    } catch (err) {
      setError(err.message || 'Failed to start Twitter authentication');
      setStep('error');
    }
  };

  const onSubmit = async (data) => {
    try {
      setError(null);
      setStep('processing');
      
      const credentials = {
        username: data.username,
        password: data.password,
        two_factor_token: data.twoFactorToken || undefined
      };
      
      const response = await authService.completeTwitterAuth(requestId, credentials);
      
      if (response.success) {
        setStep('success');
        if (onSuccess) {
          onSuccess(response);
        }
        toast.success('Twitter account linked successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Authentication failed');
        setStep('error');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate with Twitter');
      setStep('error');
    }
  };

  const checkStatus = async () => {
    try {
      const response = await authService.checkTwitterAuthStatus(requestId);
      if (response.status === 'completed') {
        clearInterval(statusCheckInterval);
        setStep('success');
        if (onSuccess) {
          onSuccess(response);
        }
      } else if (response.status === 'failed') {
        clearInterval(statusCheckInterval);
        setError(response.error || 'Authentication failed');
        setStep('error');
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Link X (Twitter) Account</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'initial' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Initializing...</p>
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Please enter your X (Twitter) credentials to link your account. Your credentials are only used for authentication and are not stored.
            </p>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="twoFactorToken" className="block text-sm font-medium text-gray-700">
                Two-Factor Authentication Code (if enabled)
              </label>
              <input
                id="twoFactorToken"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('twoFactorToken')}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Link Account
              </button>
            </div>
          </form>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Authenticating with X (Twitter)...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">Account linked successfully!</p>
            <p className="text-sm text-gray-500 mt-2">You can now view your X metrics</p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">Authentication failed</p>
            <p className="text-sm text-red-600 mt-2">{error}</p>
            <button
              onClick={() => setStep('credentials')}
              className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterAuthModal;