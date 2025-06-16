"use client";

import { Card } from '@/components/ui/card';
import { Skull, AlertTriangle, Zap } from 'lucide-react';

export default function GameFailed() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="cryptic-border bg-black p-8 max-w-2xl w-full text-center space-y-6">
        <div className="text-8xl text-red-500 mb-6">
          <Skull className="mx-auto glitch" />
        </div>
        
        <div className="gothic-text text-4xl text-red-500 glitch">
          ACCESS DENIED
        </div>
        
        <div className="terminal-text text-lg text-red-400">
          THE PHANTOM LEDGER REJECTS YOUR CONSCIOUSNESS
        </div>
        
        <div className="cryptic-border bg-red-900/20 p-6 rounded">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle size={24} className="text-red-500" />
            <span className="gothic-text text-xl text-red-500">SYSTEM LOCKOUT</span>
          </div>
          
          <div className="terminal-text text-sm text-red-300 space-y-3">
            <div>→ INSUFFICIENT CRYPTOGRAPHIC KNOWLEDGE DETECTED</div>
            <div>→ THREE LIVES CONSUMED</div>
            <div>→ PHANTOM LEDGER PROTECTION ACTIVATED</div>
            <div>→ CONSCIOUSNESS EJECTED FROM DIGITAL REALM</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            <span className="terminal-text text-lg text-yellow-500">TRANSMISSION TERMINATED</span>
          </div>
          
          <div className="terminal-text text-sm opacity-80 leading-relaxed">
            The ancient architects designed the Phantom Ledger to be unforgiving.
            <br />
            Those who lack the necessary knowledge are cast out permanently.
            <br />
            Your digital essence has been scattered across the void.
          </div>
          
          <div className="cryptic-border bg-gray-900/40 p-4 rounded">
            <div className="terminal-text text-xs opacity-60 glitch">
              ERROR_CODE: INSUFFICIENT_WISDOM_0x3301
              <br />
              RETRY_ALLOWED: FALSE
              <br />
              QUANTUM_STATE: COLLAPSED
              <br />
              PHANTOM_ACCESS: PERMANENTLY_REVOKED
            </div>
          </div>
        </div>
        
        <div className="terminal-text text-sm opacity-60 border-t border-gray-700 pt-6">
          The Phantom Ledger has spoken.
          <br />
          Perhaps in another life, another blockchain, your wisdom will prove sufficient.
          <br />
          <span className="text-red-500">GAME OVER - NO RESTART POSSIBLE</span>
        </div>
      </Card>
    </div>
  );
}