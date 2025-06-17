"use client";

import { useState, useEffect } from 'react';
import { walletManager, WalletState } from '@/lib/wallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Info, 
  HelpCircle, 
  Network, 
  Timer,
  Coins,
  Brain,
  Shield,
  Zap,
  RefreshCw,
  Bug
} from 'lucide-react';

interface HomePageProps {
  walletState: WalletState;
  onStartGame: () => void;
}

export default function HomePage({ walletState, onStartGame }: HomePageProps) {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [showRules, setShowRules] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(walletState.balance);

  useEffect(() => {
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    try {
      const info = await walletManager.getNetworkInfo();
      setNetworkInfo(info);
    } catch (error) {
      console.error('Failed to load network info:', error);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      const newBalance = await walletManager.refreshBalance();
      setCurrentBalance(newBalance);
      console.log('Balance refreshed:', newBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const aptosEcosystem = [
    { name: 'Petra Wallet', description: 'Gateway to the Aptos realm' },
    { name: 'Pontem Network', description: 'Bridge between worlds' },
    { name: 'Thala Finance', description: 'DeFi protocols of power' },
    { name: 'Econia Protocol', description: 'Order book mysteries' },
    { name: 'Topaz Market', description: 'NFT treasures exchange' },
    { name: 'Tortuga Staking', description: 'Liquid staking rituals' },
    { name: 'Move Language', description: 'The sacred programming tongue' },
    { name: 'Aptos Names', description: 'Identity in the phantom realm' }
  ];

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="cyber-glow gothic-text text-4xl md:text-6xl">
          APTOSIGMA 2025
        </div>
        <div className="terminal-text text-lg opacity-80">
          The Phantom Ledger Awaits Your Entry
        </div>
      </div>

      {/* Wallet Info Bar */}
      <Card className="cryptic-border bg-black p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Wallet size={20} />
            <span className="terminal-text">
              {walletManager.formatAddress(walletState.address!)}
            </span>
            <div className="flex items-center gap-2">
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshBalance}
                disabled={refreshing}
                className="p-2"
              >
                <RefreshCw size={14} className={refreshing ? 'rotating-loader' : ''} />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-500 text-green-500">
              TESTNET CONNECTED
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSupport(!showSupport)}
              >
                <HelpCircle size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRules(!showRules)}
              >
                <Info size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Debug Info */}
      {showDebug && (
        <Card className="cryptic-border bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bug size={20} />
            <span className="gothic-text text-xl">Wallet Debug Information</span>
          </div>
          <div className="terminal-text text-sm space-y-2 opacity-90">
            <div>• Check browser console for detailed debug logs</div>
            <div>• Current API endpoint: https://api.testnet.staging.aptoslabs.com/v1</div>
            <div>• Wallet address: {walletState.address}</div>
            <div>• Network: {walletState.network}</div>
          </div>
        </Card>
      )}

      {/* Network Status */}
      {networkInfo && (
        <Card className="cryptic-border bg-black p-4">
          <div className="flex items-center gap-2 mb-4">
            <Network size={20} />
            <span className="gothic-text text-lg">Network Status</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 terminal-text text-sm">
            <div>
              <div className="opacity-60">Chain ID</div>
              <div className="cyber-glow">{networkInfo.chain_id}</div>
            </div>
            <div>
              <div className="opacity-60">Epoch</div>
              <div className="cyber-glow">{networkInfo.epoch}</div>
            </div>
            <div>
              <div className="opacity-60">Block Height</div>
              <div className="cyber-glow">{networkInfo.block_height}</div>
            </div>
            <div>
              <div className="opacity-60">Ledger Version</div>
              <div className="cyber-glow">{networkInfo.ledger_version}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Rules Card */}
      {showRules && (
        <Card className="cryptic-border bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} />
            <span className="gothic-text text-xl">Rules of the Phantom Ledger</span>
          </div>
          <div className="terminal-text text-sm space-y-3 opacity-90">
            <div>• You have only <span className="cyber-glow">THREE LIVES</span> - use them wisely</div>
            <div>• <span className="cyber-glow">20 QUESTIONS</span> across 4 levels of increasing difficulty</div>
            <div>• Each wrong answer costs one life - <span className="text-red-500">no retries</span></div>
            <div>• Scoring is based on <span className="cyber-glow">speed and accuracy</span></div>
            <div>• Questions focus on the <span className="cyber-glow">Aptos ecosystem</span></div>
            <div>• Hints available but reduce your score by 3 points</div>
            <div>• <span className="text-red-500">One chance only</span> - no restart after completion</div>
            <div>• APT rewards calculated: <span className="cyber-glow">10 points = 0.01 APT</span></div>
          </div>
        </Card>
      )}

      {/* Support Card */}
      {showSupport && (
        <Card className="cryptic-border bg-black p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={20} />
            <span className="gothic-text text-xl">Support & Session</span>
          </div>
          <div className="terminal-text text-sm space-y-3 opacity-90">
            <div>• Your progress is automatically saved</div>
            <div>• Wallet session persists through browser refresh</div>
            <div>• All answers must be <span className="cyber-glow">lowercase single words</span></div>
            <div>• Numbers and underscores allowed in answers</div>
            <div>• Read each story fragment carefully for context</div>
            <div>• The Phantom Ledger remembers everything</div>
            <div className="text-yellow-500">
              • Balance Issues: Use the debug button to check API connectivity
            </div>
          </div>
        </Card>
      )}

      {/* Ecosystem Carousel */}
      <Card className="cryptic-border bg-black p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain size={20} />
          <span className="gothic-text text-xl">Aptos Ecosystem Knowledge</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aptosEcosystem.map((item, index) => (
            <div key={index} className="cryptic-border bg-gray-900/20 p-4 rounded">
              <div className="terminal-text font-bold cyber-glow">{item.name}</div>
              <div className="terminal-text text-sm opacity-60 mt-1">{item.description}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Game Stats Preview */}
      <Card className="cryptic-border bg-black p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} />
          <span className="gothic-text text-xl">Challenge Preview</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 terminal-text">
          <div className="text-center">
            <div className="text-2xl cyber-glow">4</div>
            <div className="text-sm opacity-60">Levels</div>
          </div>
          <div className="text-center">
            <div className="text-2xl cyber-glow">20</div>
            <div className="text-sm opacity-60">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl cyber-glow">5</div>
            <div className="text-sm opacity-60">Lives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl cyber-glow">∞</div>
            <div className="text-sm opacity-60">Glory</div>
          </div>
        </div>
      </Card>

      {/* Enter Button */}
      <div className="text-center">
        <Button
          onClick={onStartGame}
          className="bg-white text-black hover:bg-gray-200 terminal-text text-lg px-8 py-4 cyber-glow"
          size="lg"
        >
          <Timer className="mr-2" />
          ENTER THE PHANTOM LEDGER
        </Button>
      </div>

      {/* Footer Warning */}
      <div className="text-center terminal-text text-sm opacity-60 pb-8">
        Warning: Once you enter, there is no return to this realm.
        <br />
        The Phantom Ledger grants only one opportunity for enlightenment.
      </div>
    </div>
  );
}