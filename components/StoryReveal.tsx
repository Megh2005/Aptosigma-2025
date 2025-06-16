"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CRYPTIC_STORY } from '@/lib/game-data';
import { Skull, Eye } from 'lucide-react';

interface StoryRevealProps {
  onContinue: () => void;
}

export default function StoryReveal({ onContinue }: StoryRevealProps) {
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  const paragraphs = CRYPTIC_STORY.trim().split('\n\n').filter(p => p.length > 0);

  useEffect(() => {
    if (currentParagraph < paragraphs.length) {
      const timer = setTimeout(() => {
        setCurrentParagraph(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowContinue(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentParagraph, paragraphs.length]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="cryptic-border bg-black p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="cyber-glow gothic-text text-4xl mb-4 flex items-center justify-center gap-4">
            <Skull size={40} />
            THE PHANTOM LEDGER
            <Eye size={40} />
          </div>
          <div className="terminal-text text-sm opacity-60">
            CLASSIFIED: EYES ONLY - CLEARANCE LEVEL SIGMA
          </div>
        </div>

        <div className="space-y-6 terminal-text text-base leading-relaxed">
          {paragraphs.slice(0, currentParagraph + 1).map((paragraph, index) => (
            <div
              key={index}
              className={`opacity-0 animate-fade-in ${index === currentParagraph ? 'cyber-glow' : 'opacity-80'}`}
              style={{
                animation: `fadeIn 1.5s ease-in forwards`,
                animationDelay: '0.5s'
              }}
            >
              {paragraph}
            </div>
          ))}
        </div>

        {currentParagraph < paragraphs.length && (
          <div className="flex justify-center mt-8"></div>
        )}

        {showContinue && (
          <div className="text-center mt-8 space-y-4">
            <div className="terminal-text text-sm opacity-60 cyber-glow glitch">
              THE PHANTOM LEDGER RECOGNIZES YOUR PRESENCE
            </div>
            <Button
              onClick={onContinue}
              className="bg-white text-black hover:bg-gray-200 terminal-text px-8 py-4"
            >
              I ACCEPT THE CHALLENGE
            </Button>
          </div>
        )}
      </Card>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in forwards;
        }
      `}</style>
    </div>
  );
}