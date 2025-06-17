"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { walletManager, WalletState } from '@/lib/wallet';
import { db } from '@/firebase/init';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Coins,
  Shield,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Lock,
  Settings,
  XCircle
} from 'lucide-react';

interface StakingStepProps {
  walletState: WalletState;
  onStakingComplete: () => void;
}

export default function StakingStep({ walletState, onStakingComplete }: StakingStepProps) {
  const [isStaking, setIsStaking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [stakingStatus, setStakingStatus] = useState<'checking' | 'not-initialized' | 'not-staked' | 'staked' | 'staking' | 'initializing' | 'failed'>('checking');
  const [stakeInfo, setStakeInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [initialBalance, setInitialBalance] = useState<any>(null);
  const [showFailedState, setShowFailedState] = useState(false);

  // Updated module address
  const MODULE_ADDRESS = "0x4afbef1832e39a9e7f4ca7434bcf216e4d2864f9da4003d2627558928ac30f54";

  // Log the balance we receive
  console.log("Balance received in StakingStep:", walletState.balance);

  // Store initial balance when component mounts
  useEffect(() => {
    if (walletState.balance && !initialBalance) {
      setInitialBalance(walletState.balance);
      console.log("Initial balance stored:", walletState.balance);
    }
  }, [walletState.balance, initialBalance]);

  // Helper function to convert balance to APT
  const convertToAPT = (balance: any): number => {
    try {
      if (balance === null || balance === undefined) {
        console.log("Balance is null/undefined, returning 0");
        return 0;
      }

      const numericBalance = typeof balance === 'string' ? parseInt(balance) : balance;
      console.log("Numeric balance:", numericBalance);
      const aptAmount = numericBalance / 100000000; // Convert microAPT to APT
      console.log("APT amount:", aptAmount);
      return aptAmount;
    } catch (error) {
      console.log("Error converting balance to APT:", error);
      return 0;
    }
  };

  // Helper function to format APT display
  const formatAPT = (balance: any): string => {
    const aptAmount = convertToAPT(balance);
    return aptAmount.toFixed(4);
  };

  // Helper function to check if balance is sufficient (1 APT = 100000000 microAPT)
  const hasInsufficientBalance = (balance: any): boolean => {
    try {
      if (balance === null || balance === undefined) {
        console.log("Balance is null/undefined, insufficient");
        return true;
      }

      const numericBalance = typeof balance === 'string' ? parseInt(balance) : balance;
      const isInsufficient = numericBalance < 100000000; // Less than 1 APT in microAPT
      console.log("Balance sufficiency check - numericBalance:", numericBalance, "insufficient:", isInsufficient);
      return isInsufficient;
    } catch (error) {
      console.log("Error checking balance sufficiency:", error);
      return true; // Assume insufficient if can't parse
    }
  };

  // Function to check balance reduction and update Firebase
  const checkBalanceReductionAndUpdate = async (newBalance: any) => {
    try {
      if (!initialBalance || !newBalance || !walletState.address) {
        console.log("Missing data for balance check:", { initialBalance, newBalance, address: walletState.address });
        return false;
      }

      const initialBalanceNum = typeof initialBalance === 'string' ? parseInt(initialBalance) : initialBalance;
      const newBalanceNum = typeof newBalance === 'string' ? parseInt(newBalance) : newBalance;
      const balanceReduction = initialBalanceNum - newBalanceNum;

      console.log("Balance reduction check:", {
        initial: initialBalanceNum,
        new: newBalanceNum,
        reduction: balanceReduction,
        threshold: 100000000
      });

      // If balance reduction is greater than or equal to 1 APT (100,000,000 Octas)
      if (balanceReduction >= 100000000) {
        console.log("Balance reduction detected, updating Firebase...");

        // Update user document in Firebase
        const userDocRef = doc(db, 'users', walletState.address);
        await updateDoc(userDocRef, {
          isStaked: true,
          stakingTimestamp: serverTimestamp(),
          stakingModule: MODULE_ADDRESS,
          lastStakeAmount: balanceReduction,
          lastUpdated: serverTimestamp()
        });

        console.log("Firebase updated with staking status");

        // Save staking completion to localStorage
        localStorage.setItem('aptosigma_staking_complete', 'true');
        localStorage.setItem('aptosigma_staking_module', MODULE_ADDRESS);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking balance reduction or updating Firebase:", error);
      return false;
    }
  };

  useEffect(() => {
    checkContractStatus();
  }, [walletState.address]);

  const checkContractStatus = async () => {
    if (!walletState.address) return;

    setStakingStatus('checking');
    setError(null);

    try {
      // First check if the contract is initialized
      const isInitialized = await walletManager.checkContractInitialized(MODULE_ADDRESS);

      if (!isInitialized) {
        setStakingStatus('not-initialized');
        return;
      }

      // If initialized, check staking status
      const isStaked = await walletManager.checkStakingStatus(walletState.address, MODULE_ADDRESS);

      if (isStaked) {
        const info = await walletManager.getStakeInfo(walletState.address, MODULE_ADDRESS);
        setStakeInfo(info);
        setStakingStatus('staked');
      } else {
        setStakingStatus('not-staked');
      }
    } catch (error: any) {
      console.error("Error checking contract status:", error);

      // Check if this is the E_NOT_INITIALIZED error
      if (error.message && error.message.includes('E_NOT_INITIALIZED')) {
        setStakingStatus('not-initialized');
      } else {
        setStakingStatus('not-staked');
        setError(`Contract check failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleInitializeContract = async () => {
    setIsInitializing(true);
    setError(null);
    setStakingStatus('initializing');

    try {
      // Call initialize function on the contract
      const result = await walletManager.initializeContract(MODULE_ADDRESS);

      if (result.success) {
        setTxHash(result.hash || null);
        // Wait for the transaction to be processed
        setTimeout(async () => {
          await checkContractStatus(); // Refresh contract status
        }, 3000);
      } else {
        setError(result.error || 'Failed to initialize contract');
        console.log("Initialization failed, proceeding automatically...");
        // Automatically proceed on failure
        setTimeout(() => {
          handleContinue();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Initialization error:", error);
      setError(error.message || 'Contract initialization failed');
      console.log("Initialization error, proceeding automatically...");
      // Automatically proceed on error
      setTimeout(() => {
        handleContinue();
      }, 2000);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStake = async () => {
    setIsStaking(true);
    setError(null);
    setStakingStatus('staking');

    try {
      // Call stake function with the module address
      const result = await walletManager.stakeAPT(MODULE_ADDRESS);

      if (result.success) {
        setTxHash(result.hash || null);

        // Update Firebase with staking status
        if (walletState.address) {
          try {
            const userDocRef = doc(db, 'users', walletState.address);
            await updateDoc(userDocRef, {
              isStaked: true,
              stakingTimestamp: serverTimestamp(),
              stakingModule: MODULE_ADDRESS,
              lastUpdated: serverTimestamp()
            });
            console.log("Firebase updated with staking status");
          } catch (firebaseError) {
            console.error("Error updating Firebase:", firebaseError);
          }
        }

        // Save staking completion to localStorage
        localStorage.setItem('aptosigma_staking_complete', 'true');
        localStorage.setItem('aptosigma_staking_module', MODULE_ADDRESS);

        // Proceed directly to next step
        onStakingComplete();
      } else {
        setError(result.error || 'Failed to stake APT');
        console.log("Staking failed, proceeding automatically...");
        // Automatically proceed on failure
        setTimeout(() => {
          handleContinue();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Staking error:", error);
      setError(error.message || 'Staking transaction failed');
      console.log("Staking error, proceeding automatically...");
      // Automatically proceed on error
      setTimeout(() => {
        handleContinue();
      }, 2000);
    } finally {
      setIsStaking(false);
    }
  };

  const handleContinue = async () => {
    // Update Firebase when manually continuing (even after failure)
    if (walletState.address) {
      try {
        const userDocRef = doc(db, 'users', walletState.address);
        await updateDoc(userDocRef, {
          isStaked: stakingStatus === 'staked', // Only mark as staked if actually staked
          stakingTimestamp: serverTimestamp(),
          stakingModule: MODULE_ADDRESS,
          lastUpdated: serverTimestamp(),
          stakingFailed: stakingStatus === 'failed' // Track if staking failed
        });
      } catch (error) {
        console.error("Error updating Firebase on manual continue:", error);
      }
    }

    // Save completion to localStorage regardless of staking success
    localStorage.setItem('aptosigma_staking_complete', 'true');
    localStorage.setItem('aptosigma_staking_module', MODULE_ADDRESS);
    if (stakingStatus === 'failed') {
      localStorage.setItem('aptosigma_staking_failed', 'true');
    }

    onStakingComplete();
  };

  const formatTimestamp = (timestamp: string | number) => {
    // Handle both seconds and microseconds
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    // If timestamp is in microseconds, convert to milliseconds
    const milliseconds = timestampNum > 1000000000000 ? timestampNum / 1000 : timestampNum * 1000;
    const date = new Date(milliseconds);
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
            Checking contract initialization status...
          </div>
          <div className="terminal-text text-xs opacity-60 mt-4">
            Module: {walletManager.formatAddress(MODULE_ADDRESS)}
          </div>
        </Card>
      </div>
    );
  }

  if (stakingStatus === 'not-initialized') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-2xl w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="text-6xl text-yellow-500">
              <Settings className="mx-auto" />
            </div>
            <div className="gothic-text text-3xl text-yellow-500">
              CONTRACT INITIALIZATION REQUIRED
            </div>
            <div className="terminal-text text-lg opacity-80">
              The Phantom Ledger awaits activation
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
                  {formatAPT(walletState.balance)} APT
                </Badge>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                TESTNET
              </Badge>
            </div>
          </Card>

          {/* Initialization Info */}
          <Card className="cryptic-border bg-yellow-900/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={20} className="text-yellow-500" />
              <span className="gothic-text text-xl text-yellow-500">Initialization Required</span>
            </div>

            <div className="terminal-text text-sm space-y-3 opacity-90">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-500" />
                <span>The staking contract has not been initialized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>You can initialize it to enable staking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>One-time setup required before first use</span>
              </div>
            </div>
          </Card>

          {/* Contract Info */}
          <Card className="cryptic-border bg-gray-900/20 p-4">
            <div className="terminal-text text-xs opacity-60 space-y-1">
              <div>Contract: {walletManager.formatAddress(MODULE_ADDRESS)}</div>
              <div>Module: flexibleStaking</div>
              <div>Network: Aptos Testnet</div>
              <div>Status: Not Initialized</div>
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
            <Button
              onClick={handleInitializeContract}
              disabled={isInitializing}
              className="w-full bg-yellow-500 text-black hover:bg-yellow-400 terminal-text text-lg py-4"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="rotating-loader mr-2" size={20} />
                  INITIALIZING CONTRACT...
                </>
              ) : (
                <>
                  <Settings className="mr-2" />
                  INITIALIZE PHANTOM LEDGER
                </>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center terminal-text text-xs opacity-60">
            Initialize the contract to awaken the Phantom Ledger.
            <br />
            If initialization fails, you will automatically proceed to the next step.
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
                  <div className="cyber-glow text-lg">{stakeInfo.amount / 100000000} APT</div>
                </div>
                <div>
                  <div className="opacity-60">Stake Time</div>
                  <div className="cyber-glow">{formatTimestamp(stakeInfo.stakeTime)}</div>
                </div>
                <div>
                  <div className="opacity-60">Status</div>
                  <div className="cyber-glow text-green-500">
                    {stakeInfo.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {txHash && (
            <div className="cryptic-border bg-gray-900/40 p-4 rounded">
              <div className="terminal-text text-xs opacity-60">
                Transaction Hash:
                <br />
                <span className="break-all font-mono">{txHash}</span>
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

  if (stakingStatus === 'failed' && showFailedState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-2xl w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="text-6xl text-red-500">
              <XCircle className="mx-auto" />
            </div>
            <div className="gothic-text text-3xl text-red-500">
              STAKING RITUAL DISRUPTED
            </div>
            <div className="terminal-text text-lg opacity-80">
              The Phantom Ledger remains sealed, but the path continues
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
                  {formatAPT(walletState.balance)} APT
                </Badge>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                TESTNET
              </Badge>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="cryptic-border bg-red-900/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-red-500" />
                <span className="gothic-text text-xl text-red-500">Error Details</span>
              </div>
              <div className="terminal-text text-sm text-red-400">
                {error}
              </div>
            </Card>
          )}

          {/* Transaction Hash if available */}
          {txHash && (
            <Card className="cryptic-border bg-gray-900/40 p-4">
              <div className="terminal-text text-xs opacity-60">
                Transaction Hash:
                <br />
                <span className="break-all font-mono">{txHash}</span>
              </div>
            </Card>
          )}

          {/* Continue Options */}
          <Card className="cryptic-border bg-blue-900/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-blue-400" />
              <span className="gothic-text text-xl text-blue-400">The Journey Continues</span>
            </div>

            <div className="terminal-text text-sm space-y-3 opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Staking is optional for exploration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>You can proceed without staking</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-yellow-500" />
                <span>Some features may require staking later</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => {
                setShowFailedState(false);
                setStakingStatus('not-staked');
                setError(null);
              }}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-900/20 terminal-text text-lg py-4"
            >
              <Settings className="mr-2" />
              TRY STAKING AGAIN
            </Button>

            <Button
              onClick={handleContinue}
              className="w-full bg-white text-black hover:bg-gray-200 terminal-text text-lg py-4"
            >
              <Shield className="mr-2" />
              PROCEED WITHOUT STAKING
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center terminal-text text-xs opacity-60">
            The mysteries await, staked or unstaked.
            <br />
            Your journey through the Phantom Ledger begins now.
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
                {formatAPT(walletState.balance)} APT
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
              <span>Stake is optional but recommended</span>
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
            <div>Contract: {walletManager.formatAddress(MODULE_ADDRESS)}</div>
            <div>Module: flexibleStaking</div>
            <div>Network: Aptos Testnet</div>
            <div>Status: Ready for Staking</div>
          </div>
        </Card>

        {/* Debug Info - Current Balance */}
        <Card className="cryptic-border bg-gray-900/20 p-4">
          <div className="terminal-text text-xs opacity-60 space-y-1">
            <div>Current Balance: {formatAPT(walletState.balance)} APT</div>
            <div>Sufficient Balance: {!hasInsufficientBalance(walletState.balance) ? 'Yes' : 'No'}</div>
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
          {hasInsufficientBalance(walletState.balance) ? (
            <div className="space-y-4">
              <div className="text-center terminal-text text-sm text-red-400">
                Insufficient APT balance. You need at least 1 APT to stake.
                <br />
                Current: {formatAPT(walletState.balance)} APT
              </div>
              <Button
                onClick={handleContinue}
                className="w-full bg-white text-black hover:bg-gray-200 terminal-text text-lg py-4"
              >
                <Shield className="mr-2" />
                PROCEED TO PHANTOM LEDGER
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStake}
              disabled={isStaking}
              className="w-full bg-white text-black hover:bg-gray-200 terminal-text text-lg py-4"
            >
              {isStaking ? (
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
          If staking fails, you will automatically proceed to explore the mysteries.
          <br />
          <span className="font-mono">{MODULE_ADDRESS}</span>
        </div>
      </Card>
    </div>
  );
}