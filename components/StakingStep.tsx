"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { walletManager, WalletState } from '@/lib/wallet';
import {
  Coins,
  Shield,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Lock
} from 'lucide-react';

interface StakingStepProps {
  walletState: WalletState;
  onStakingComplete: () => void;
}

export default function StakingStep({ walletState, onStakingComplete }: StakingStepProps) {
  const [isStaking, setIsStaking] = useState(false);
  const [stakingStatus, setStakingStatus] = useState<'checking' | 'not-staked' | 'staked' | 'staking'>('checking');
  const [stakeInfo, setStakeInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Save the raw balance output as JSON string - this is the ONLY balance we use
  const rawBalanceData = JSON.stringify(walletState.balance, null, 2);

  // Helper function to convert raw balance to APT
  const convertRawToAPT = (rawBalanceString: string): number => {
    try {
      const balance = JSON.parse(rawBalanceString);
      const numericBalance = typeof balance === 'string' ? parseInt(balance) : balance;
      return numericBalance / 100000000; // Convert microAPT to APT
    } catch (error) {
      console.error('Error parsing raw balance:', error);
      return 0;
    }
  };

  // Helper function to format APT display
  const formatAPT = (rawBalanceString: string): string => {
    const aptAmount = convertRawToAPT(rawBalanceString);
    return aptAmount.toFixed(4);
  };

  // Helper function to check if balance is sufficient (1 APT = 100000000 microAPT)
  const hasInsufficientBalance = (rawBalanceString: string): boolean => {
    try {
      const balance = JSON.parse(rawBalanceString);
      const numericBalance = typeof balance === 'string' ? parseInt(balance) : balance;
      return numericBalance < 100000000; // Less than 1 APT in microAPT
    } catch (error) {
      console.error('Error parsing raw balance for insufficiency check:', error);
      return true; // Assume insufficient if can't parse
    }
  };

  useEffect(() => {
    checkExistingStake();
  }, [walletState.address]);

  const checkExistingStake = async () => {
    if (!walletState.address) return;

    setStakingStatus('checking');
    try {
      const isStaked = await walletManager.checkStakingStatus(walletState.address);

      if (isStaked) {
        const info = await walletManager.getStakeInfo(walletState.address);
        setStakeInfo(info);
        setStakingStatus('staked');
      } else {
        setStakingStatus('not-staked');
      }
    } catch (error) {
      console.error('Failed to check staking status:', error);
      setStakingStatus('not-staked');
    }
  };

  const handleStake = async () => {
    setIsStaking(true);
    setError(null);
    setStakingStatus('staking');

    try {
      const result = await walletManager.stakeAPT();

      if (result.success) {
        setTxHash(result.hash || null);
        await checkExistingStake(); // Refresh staking status
      } else {
        setError(result.error || 'Failed to stake APT');
        setStakingStatus('not-staked');
      }
    } catch (error: any) {
      setError(error.message || 'Staking transaction failed');
      setStakingStatus('not-staked');
    } finally {
      setIsStaking(false);
    }
  };

  const handleContinue = () => {
    // Save staking completion to session
    sessionStorage.setItem('aptosigma_staking_complete', 'true');
    onStakingComplete();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) / 1000); // Convert microseconds to milliseconds
    return date.toLocaleString();
  };

  if (stakingStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-white rotating-loader mx-auto mb-6"></div>
          <div className="gothic-text text-2xl mb-4">
            SCANNING PHANTOM LEDGER
          </div>
          <div className="terminal-text text-sm opacity-80">
            Checking your staking status...
          </div>
        </Card>
      </div>
    );
  }

  if (stakingStatus === 'staked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-2xl w-full text-center space-y-6">
          <div className="text-6xl text-green-500 mb-6">
            <CheckCircle className="mx-auto" />
          </div>

          <div className="gothic-text text-3xl text-green-500">
            STAKE CONFIRMED
          </div>

          <div className="terminal-text text-lg opacity-80">
            Your APT is secured in the Phantom Ledger
          </div>

          {stakeInfo && (
            <Card className="cryptic-border bg-green-900/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={20} className="text-green-500" />
                <span className="gothic-text text-lg text-green-500">Stake Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 terminal-text text-sm">
                <div>
                  <div className="opacity-60">Staked Amount</div>
                  <div className="cyber-glow text-lg">{stakeInfo.amount} APT</div>
                </div>
                <div>
                  <div className="opacity-60">Stake Time</div>
                  <div className="cyber-glow">{formatTimestamp(stakeInfo.stakeTime)}</div>
                </div>
              </div>
            </Card>
          )}

          {txHash && (
            <div className="cryptic-border bg-gray-900/40 p-4 rounded">
              <div className="terminal-text text-xs opacity-60">
                Transaction Hash:
                <br />
                <span className="break-all">{txHash}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="terminal-text text-sm opacity-80">
              Your stake grants you access to the deepest mysteries.
              <br />
              The Phantom Ledger recognizes your commitment.
            </div>

            <Button
              onClick={handleContinue}
              className="bg-white text-black hover:bg-gray-200 terminal-text px-8 py-4"
              size="lg"
            >
              <Shield className="mr-2" />
              PROCEED TO PHANTOM LEDGER
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="cryptic-border bg-black p-8 max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl cyber-glow">
            <Coins className="mx-auto" />
          </div>
          <div className="gothic-text text-3xl cyber-glow">
            PHANTOM LEDGER ENTRY FEE
          </div>
          <div className="terminal-text text-lg opacity-80">
            Stake 1 APT to unlock the ancient mysteries
          </div>
        </div>

        {/* Wallet Info */}
        <Card className="cryptic-border bg-gray-900/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="terminal-text">
                {walletManager.formatAddress(walletState.address!)}
              </div>
              <Badge variant="outline" className="border-white text-white">
                {formatAPT(rawBalanceData)} APT
              </Badge>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-500">
              TESTNET
            </Badge>
          </div>
        </Card>

        {/* Staking Requirements */}
        <Card className="cryptic-border bg-blue-900/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} />
            <span className="gothic-text text-xl">Staking Requirements</span>
          </div>

          <div className="terminal-text text-sm space-y-3 opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Exactly 1 APT will be staked</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Stake is required to access the game</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Your stake remains secure in the contract</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-500" />
              <span>Potential rewards based on game performance</span>
            </div>
          </div>
        </Card>

        {/* Contract Info */}
        <Card className="cryptic-border bg-gray-900/20 p-4">
          <div className="terminal-text text-xs opacity-60 space-y-1">
            <div>Contract: {walletManager.formatAddress("0xa15ac83fec3d7693c55992835fe8e7ac3f3d3486d61193aa411176f0f4d32d58")}</div>
            <div>Module: flexibleStaking</div>
            <div>Network: Aptos Testnet</div>
          </div>
        </Card>

        {/* Debug Info - Raw Balance JSON Output */}
        <Card className="cryptic-border bg-gray-900/20 p-4">
          <div className="terminal-text text-xs opacity-60 space-y-1">
            <div>Raw Balance JSON Output:</div>
            <pre className="whitespace-pre-wrap break-all">{rawBalanceData}</pre>
            <div>APT Equivalent: {formatAPT(rawBalanceData)}</div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="cryptic-border bg-red-900/20 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              <span className="terminal-text text-sm">{error}</span>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {hasInsufficientBalance(rawBalanceData) ? (
            <div className="text-center space-y-4">
              <div className="terminal-text text-sm text-red-400">
                Insufficient APT balance. You need at least 1 APT to stake.
                <br />
                Current: {formatAPT(rawBalanceData)} APT (Raw JSON: {rawBalanceData})
              </div>
              <Button
                disabled
                className="w-full bg-gray-600 text-gray-400 terminal-text"
              >
                INSUFFICIENT BALANCE
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStake}
              disabled={isStaking || stakingStatus === 'staking'}
              className="w-full bg-white text-black hover:bg-gray-200 terminal-text text-lg py-4"
            >
              {isStaking || stakingStatus === 'staking' ? (
                <>
                  <Loader2 className="rotating-loader mr-2" size={20} />
                  STAKING IN PROGRESS...
                </>
              ) : (
                <>
                  <Coins className="mr-2" />
                  STAKE 1 APT TO ENTER
                </>
              )}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center terminal-text text-xs opacity-60">
          By staking, you commit to the Phantom Ledger's ancient protocols.
          <br />
          Your APT will be held securely until the mysteries are revealed.
        </div>
      </Card>
    </div>
  );
}