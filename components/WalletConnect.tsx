"use client";

import { useState, useEffect } from 'react';
import { walletManager, WalletState } from '@/lib/wallet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Wallet, AlertCircle } from 'lucide-react';
import { db } from '@/firebase/init';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface WalletConnectProps {
  onConnected: (walletState: WalletState) => void;
}

interface UserData {
  address: string;
  network: string;
  lives: number;
  totalGamesPlayed: number;
  totalScore: number;
  createdAt: any;
  lastConnected: any;
  currentGameScore?: number; // Optional for existing users
}

export default function WalletConnect({ onConnected }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(walletManager.getState());
  const [userLives, setUserLives] = useState<number>(5);


  useEffect(() => {
    // Check if already connected from session
    const state = walletManager.getState();
    if (state.connected && state.address) {
      setWalletState(state);
      onConnected(state);
    }
  }, [onConnected]);

  const saveWalletToFirebase = async (walletState: WalletState) => {
    try {
      if (!walletState.address) {
        throw new Error('No wallet address available');
      }

      const userDocRef = doc(db, 'users', walletState.address);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, update last connected time
        await updateDoc(userDocRef, {
          lastConnected: serverTimestamp(),
          network: walletState.network
        });

        // Load current lives
        const userData = userDoc.data() as UserData;
        setUserLives(userData.lives || 5);

        console.log('Updated existing user in Firebase:', walletState.address);
      } else {
        // New user, create with initial data
        const userData: UserData = {
          address: walletState.address,
          network: walletState.network,
          lives: 5, // Allocate 5 lives
          totalGamesPlayed: 0,
          totalScore: 0,
          currentGameScore: 0,
          createdAt: serverTimestamp(),
          lastConnected: serverTimestamp()
        };

        await setDoc(userDocRef, userData);
        setUserLives(5);
        console.log('Created new user in Firebase:', walletState.address);
      }
    } catch (error) {
      console.error('Error saving wallet to Firebase:', error);
    }
  };

  const handleConnect = async () => {
    if (!walletManager.isPetraInstalled()) {
      setError('Petra wallet not detected. Please install Petra wallet extension and refresh the page.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const state = await walletManager.connectWallet();
      setWalletState(state);

      // Save wallet address to Firebase
      await saveWalletToFirebase(state);

      onConnected(state);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstallPetra = () => {
    window.open('https://petra.app/', '_blank');
  };

  if (walletState.connected) {
    return (
      <Card className="cryptic-border bg-black p-6 text-center">
        <div className="cyber-glow gothic-text text-2xl mb-4">
          PHANTOM WALLET CONNECTED
        </div>
        <div className="terminal-text text-sm space-y-2">
          <div>Address: {walletManager.formatAddress(walletState.address!)}</div>
          <div>Network: {walletState.network.toUpperCase()}</div>
          <div className="text-green-400">Lives: 5</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center space-y-6">
        <div className="cyber-glow gothic-text text-3xl">
          APTOSIGMA 2025
        </div>

        <div className="terminal-text text-sm opacity-80 text-center">
          The Phantom Ledger awaits your entry...
        </div>

        <div className="text-6xl mb-6 cyber-glow">
          <Wallet className="mx-auto" />
        </div>

        {error && (
          <div className="cryptic-border bg-red-900/20 p-4 rounded flex items-center gap-2 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!walletManager.isPetraInstalled() ? (
          <div className="space-y-4">
            <div className="terminal-text text-sm opacity-80">
              Petra wallet not detected.
              <br />
              Install Petra to access the Phantom Ledger.
            </div>
            <Button
              onClick={handleInstallPetra}
              className="w-full bg-white text-black hover:bg-gray-200 terminal-text"
            >
              INSTALL PETRA WALLET
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-white text-black hover:bg-gray-200 terminal-text"
          >
            {isConnecting ? (
              <>
                <Loader2 className="rotating-loader mr-2" size={16} />
                CONNECTING TO PHANTOM LEDGER...
              </>
            ) : (
              'CONNECT PETRA WALLET'
            )}
          </Button>
        )}

        <div className="terminal-text text-xs opacity-60 text-center">
          By connecting, you acknowledge entry into the Phantom Ledger.
          <br />
          Five lives shall be granted to worthy challengers.
        </div>
      </Card>
    </div>
  );
}