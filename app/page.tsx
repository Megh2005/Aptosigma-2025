"use client";

import { useState, useEffect } from 'react';
import { walletManager, WalletState } from '@/lib/wallet';
import WalletConnect from '@/components/WalletConnect';
import HomePage from '@/components/HomePage';
import StakingStep from '@/components/StakingStep';
import StoryReveal from '@/components/StoryReveal';
import UsernameEntry from '@/components/UsernameEntry';
import GameInterface from '@/components/GameInterface';
import GameComplete from '@/components/GameComplete';
import GameFailed from '@/components/GameFailed';

type GameState =
  | 'wallet-connect'
  | 'home'
  | 'staking'
  | 'story-reveal'
  | 'username-entry'
  | 'game-playing'
  | 'game-complete'
  | 'game-failed';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState>('wallet-connect');
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [username, setUsername] = useState<string>('');
  const [finalStats, setFinalStats] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check for existing wallet connection and game state
    const existingWallet = walletManager.getState();
    const savedUsername = sessionStorage.getItem('aptosigma_username');
    const savedGameState = sessionStorage.getItem('aptosigma_game_state');
    const stakingComplete = sessionStorage.getItem('aptosigma_staking_complete');

    if (existingWallet.connected && existingWallet.address) {
      setWalletState(existingWallet);

      if (savedUsername) {
        setUsername(savedUsername);

        if (savedGameState) {
          const gameData = JSON.parse(savedGameState);
          if (gameData.gameComplete) {
            setGameState('game-complete');
          } else if (gameData.failed) {
            setGameState('game-failed');
          } else {
            setGameState('game-playing');
          }
        } else if (stakingComplete) {
          setGameState('game-playing'); // Default to playing if wallet + username + staking exist
        } else {
          setGameState('staking'); // Need to stake first
        }
      } else if (stakingComplete) {
        setGameState('username-entry');
      } else {
        setGameState('staking'); // Need to stake before username
      }
    }
  }, [mounted]);

  const handleWalletConnected = (wallet: WalletState) => {
    setWalletState(wallet);
    setGameState('home');
  };

  const handleStartGame = () => {
    // Check if already staked
    const stakingComplete = sessionStorage.getItem('aptosigma_staking_complete');
    if (stakingComplete) {
      setGameState('story-reveal');
    } else {
      setGameState('staking');
    }
  };

  const handleStakingComplete = () => {
    setGameState('story-reveal');
  };

  const handleStoryComplete = () => {
    const savedUsername = sessionStorage.getItem('aptosigma_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setGameState('game-playing');
    } else {
      setGameState('username-entry');
    }
  };

  const handleUsernameSet = (name: string) => {
    setUsername(name);
    setGameState('game-playing');
  };

  const handleGameComplete = (stats: any) => {
    setFinalStats(stats);
    setGameState('game-complete');
  };

  const handleGameFailed = () => {
    setGameState('game-failed');
  };

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-white rotating-loader"></div>
      </div>
    );
  }

  // Render based on current game state
  switch (gameState) {
    case 'wallet-connect':
      return <WalletConnect onConnected={handleWalletConnected} />;

    case 'home':
      return (
        <HomePage
          walletState={walletState!}
          onStartGame={handleStartGame}
        />
      );

    case 'staking':
      return (
        <StakingStep
          walletState={walletState!}
          onStakingComplete={handleStakingComplete}
        />
      );

    case 'story-reveal':
      return <StoryReveal onContinue={handleStoryComplete} />;

    case 'username-entry':
      return <UsernameEntry onUsernameSet={handleUsernameSet} />;

    case 'game-playing':
      return (
        <GameInterface
          username={username}
          walletState={walletState!}
          onGameComplete={handleGameComplete}
          onGameFailed={handleGameFailed}
        />
      );

    case 'game-complete':
      return (
        <GameComplete
          finalStats={finalStats}
          username={username}
        />
      );

    case 'game-failed':
      return <GameFailed />;

    default:
      return <WalletConnect onConnected={handleWalletConnected} />;
  }
}