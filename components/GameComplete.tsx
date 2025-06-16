"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FINAL_CIPHER } from '@/lib/game-data';
import { 
  Trophy, 
  Timer, 
  Brain, 
  Lightbulb, 
  Heart, 
  Coins,
  Eye,
  Crown
} from 'lucide-react';

interface GameCompleteProps {
  finalStats: {
    score: number;
    questionsAnswered: number;
    totalTime: number;
    averageTime: number;
    hintsUsed: number;
    livesLost: number;
    aptReward: string;
  };
  username: string;
}

export default function GameComplete({ finalStats, username }: GameCompleteProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getPerformanceRank = () => {
    if (finalStats.score >= 350) return { rank: 'PHANTOM MASTER', color: 'text-purple-400' };
    if (finalStats.score >= 300) return { rank: 'CIPHER ADEPT', color: 'text-blue-400' };
    if (finalStats.score >= 200) return { rank: 'CODE BREAKER', color: 'text-green-400' };
    return { rank: 'DIGITAL SEEKER', color: 'text-yellow-400' };
  };

  const performance = getPerformanceRank();

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Victory Header */}
      <Card className="cryptic-border bg-black p-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl cyber-glow">
            <Crown className="mx-auto" />
          </div>
          <div className="gothic-text text-4xl cyber-glow">
            PHANTOM LEDGER COMPLETE
          </div>
          <div className="terminal-text text-lg opacity-80">
            {username} has proven worthy of the deepest secrets
          </div>
          <Badge className={`${performance.color} border-current text-lg px-4 py-2`}>
            {performance.rank}
          </Badge>
        </div>
      </Card>

      {/* Final Statistics */}
      <Card className="cryptic-border bg-black p-8">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={24} />
          <span className="gothic-text text-2xl">Final Statistics</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={16} />
                <span className="terminal-text">Total Score</span>
              </div>
              <span className="terminal-text font-bold cyber-glow text-xl">
                {finalStats.score}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={16} />
                <span className="terminal-text">Questions Answered</span>
              </div>
              <span className="terminal-text font-bold">
                {finalStats.questionsAnswered}/20
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={16} />
                <span className="terminal-text">Total Time</span>
              </div>
              <span className="terminal-text font-bold">
                {formatTime(finalStats.totalTime)}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={16} />
                <span className="terminal-text">Average Time</span>
              </div>
              <span className="terminal-text font-bold">
                {formatTime(Math.round(finalStats.averageTime))}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} />
                <span className="terminal-text">Hints Used</span>
              </div>
              <span className="terminal-text font-bold">
                {finalStats.hintsUsed}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={16} />
                <span className="terminal-text">Lives Lost</span>
              </div>
              <span className="terminal-text font-bold">
                {finalStats.livesLost}/3
              </span>
            </div>
          </div>
        </div>
        
        <Separator className="my-6 bg-white/20" />
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins size={20} className="text-yellow-500" />
            <span className="terminal-text text-lg">Simulated APT Reward</span>
          </div>
          <div className="cyber-glow terminal-text text-3xl font-bold">
            {finalStats.aptReward} APT
          </div>
          <div className="terminal-text text-xs opacity-60 mt-2">
            (10 points = 0.01 APT calculation)
          </div>
        </div>
      </Card>

      {/* Final Cipher */}
      <Card className="cryptic-border bg-black p-8">
        <div className="flex items-center gap-2 mb-6">
          <Eye size={24} />
          <span className="gothic-text text-2xl">The Final Revelation</span>
        </div>
        
        <div className="terminal-text text-sm font-mono whitespace-pre-line leading-relaxed">
          {FINAL_CIPHER}
        </div>
      </Card>

      {/* Achievement Unlock */}
      <Card className="cryptic-border bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-8 text-center">
        <div className="space-y-4">
          <div className="gothic-text text-2xl cyber-glow">
            ACHIEVEMENT UNLOCKED
          </div>
          <div className="terminal-text text-lg">
            "Master of the Phantom Ledger"
          </div>
          <div className="terminal-text text-sm opacity-80">
            You have successfully navigated the deepest mysteries of the Aptos ecosystem
            and proven yourself worthy of the ancient cryptographic secrets.
          </div>
          <div className="terminal-text text-xs opacity-60 mt-6">
            Your journey is complete. The Phantom Ledger will remember your achievement.
            <br />
            There is no return - your legend is now permanent in the digital realm.
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center terminal-text text-sm opacity-60 pb-8">
        The Phantom Ledger has been sealed.
        <br />
        Your consciousness returns to the surface web, forever changed.
      </div>
    </div>
  );
}