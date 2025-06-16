"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { db } from '@/firebase/init';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { walletManager } from '@/lib/wallet';

interface UsernameEntryProps {
  onUsernameSet: (username: string) => void;
}

export default function UsernameEntry({ onUsernameSet }: UsernameEntryProps) {
  const [username, setUsername] = useState('');
  const [existingUsername, setExistingUsername] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing username on component mount
  useEffect(() => {
    checkExistingUsername();
  }, []);

  const checkExistingUsername = async () => {
    try {
      const walletState = walletManager.getState();

      if (!walletState.connected || !walletState.address) {
        setError('No wallet connected');
        setIsLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', walletState.address);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data()?.username) {
        const fetchedUsername = userDoc.data().username;
        setExistingUsername(fetchedUsername);
        // Auto-set the username and call the callback
        onUsernameSet(fetchedUsername);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking existing username:', error);
      setError('Failed to check existing username');
      setIsLoading(false);
    }
  };

  const validateUsername = (value: string): boolean => {
    // Single word, lowercase, numbers and underscores allowed
    const regex = /^[a-z0-9_]+$/;
    return regex.test(value) && value.length > 0 && value.length <= 20;
  };

  const saveUsernameToFirebase = async (username: string) => {
    try {
      const walletState = walletManager.getState();

      if (!walletState.connected || !walletState.address) {
        throw new Error('No wallet connected');
      }

      const userDocRef = doc(db, 'users', walletState.address);

      // Check if document exists
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User document not found. Please reconnect your wallet.');
      }

      // Update the user document with username
      await updateDoc(userDocRef, {
        username: username,
        usernameSetAt: new Date()
      });

      console.log('Username saved to Firebase:', username, 'for address:', walletState.address);
    } catch (error) {
      console.error('Error saving username to Firebase:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateUsername(username)) {
      setError('Username must be lowercase, single word, numbers and underscores allowed');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Save username to Firebase
      await saveUsernameToFirebase(username);

      // Save to session storage as backup
      sessionStorage.setItem('aptosigma_username', username);

      onUsernameSet(username);
    } catch (err: any) {
      console.error('Failed to save username:', err);
      setError(err.message || 'Failed to save username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center space-y-6">
          <div className="cyber-glow gothic-text text-3xl">
            ACCESSING PHANTOM LEDGER
          </div>
          <div className="text-6xl mb-6 cyber-glow">
            <Loader2 className="rotating-loader mx-auto" />
          </div>
          <div className="terminal-text text-sm opacity-80">
            Checking identity records...
          </div>
        </Card>
      </div>
    );
  }

  // If username exists, show confirmation
  if (existingUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center space-y-6">
          <div className="cyber-glow gothic-text text-3xl">
            IDENTITY CONFIRMED
          </div>

          <div className="text-6xl mb-6 cyber-glow text-green-400">
            <CheckCircle className="mx-auto" />
          </div>

          <div className="terminal-text text-sm opacity-80 text-left space-y-2">
            <div>Identity found in Phantom Ledger.</div>
            <div>Welcome back, {existingUsername}.</div>
          </div>

          <div className="cryptic-border bg-green-900/20 p-4 rounded">
            <div className="terminal-text text-green-400 text-lg">
              {existingUsername}
            </div>
            <div className="text-xs opacity-60 mt-1">
              Registered cipher name
            </div>
          </div>

          <div className="terminal-text text-xs opacity-60 text-center">
            Your identity is bound to this wallet address.
            <br />
            Access granted to the Phantom Ledger.
          </div>
        </Card>
      </div>
    );
  }

  // Default username entry form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center space-y-6">
        <div className="cyber-glow gothic-text text-3xl">
          IDENTITY REQUIRED
        </div>

        <div className="text-6xl mb-6 cyber-glow">
          <User className="mx-auto" />
        </div>

        <div className="terminal-text text-sm opacity-80 text-left space-y-2">
          <div>The Phantom Ledger requires identification.</div>
          <div>Choose your cipher name carefully.</div>
          <div className="text-xs opacity-60">
            • Lowercase letters only
            <br />
            • Numbers and underscores allowed
            <br />
            • Single word (no spaces)
            <br />
            • Maximum 20 characters
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="enter_your_cipher_name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              setError('');
            }}
            onKeyPress={handleKeyPress}
            className="bg-black border-white text-white terminal-text text-center terminal-cursor"
            maxLength={20}
            disabled={isSubmitting}
          />

          {error && (
            <div className="cryptic-border bg-red-900/20 p-3 rounded flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!username || isSubmitting}
            className="w-full bg-white text-black hover:bg-gray-200 terminal-text"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="rotating-loader mr-2" size={16} />
                REGISTERING WITH PHANTOM LEDGER...
              </>
            ) : (
              'REGISTER WITH PHANTOM LEDGER'
            )}
          </Button>
        </div>

        <div className="terminal-text text-xs opacity-60 text-center">
          This identity will be bound to your wallet address.
          <br />
          Choose wisely - it cannot be changed.
        </div>
      </Card>
    </div>
  );
}