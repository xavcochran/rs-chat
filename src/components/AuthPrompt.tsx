'use client';

import { signIn, signUp, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const dispatch = useDispatch();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (needsVerification) {
        await confirmSignUp({ username: email, confirmationCode: verificationCode });
        await signIn({ username: email, password });
        const currentUser = await getCurrentUser();
        dispatch(setUser({ userId: currentUser.userId, email }));
        onClose();
      } else if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
            },
          },
        });
        setNeedsVerification(true);
      } else {
        await signIn({ username: email, password });
        const currentUser = await getCurrentUser();
        dispatch(setUser({ userId: currentUser.userId, email }));
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const modalContent = needsVerification ? (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-mono">Verify your email</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          We sent a verification code to your email
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Verification Code"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity font-mono"
        >
          Verify Email
        </button>
      </form>
    </div>
  ) : (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-mono">
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isSignUp
            ? 'Sign up to continue chatting'
            : 'Sign in to continue chatting'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
            required
          />
          {isSignUp && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
              required
            />
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity font-mono"
        >
          {isSignUp ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <p className="text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-gray-600 dark:text-gray-400 hover:underline font-mono"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-lg p-8 w-full max-w-md transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          {modalContent}
        </div>
      </div>
    </div>
  );
}