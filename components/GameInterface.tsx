"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { QUESTION_BANK, Question, LEVEL_CONFIG } from '@/lib/game-data';
import { walletManager, WalletState } from '@/lib/wallet';
import { FirebaseGameService } from '@/lib/firebase-game';
import {
  Heart,
  Timer,
  Brain,
  Lightbulb,
  Skull,
  Trophy,
  Coins,
  Star,
  Target
} from 'lucide-react';

// Fixed time limit: 20 minutes (1200 seconds)
const QUESTION_TIME_LIMIT = 1200;

interface GameState {
  level: 'easy' | 'medium' | 'hard' | 'expert';
  questionIndex: number;
  sessionScore: number; // Current session score
  currentSessionQuestions: number; // Questions answered in current session
  lives: number;
  hintsUsed: number;
  totalTime: number;
  currentQuestions: Question[];
  showHint: boolean;
  gameComplete: boolean;
  failed: boolean;
  currentGameScore?: number; // Optional for displaying current score
}

interface PersistentGameData {
  totalScore: number;
  totalQuestionsAnswered: number;
  highestScore: number;
  totalGamesPlayed: number;
  averageScore: number;
}

interface GameInterfaceProps {
  username: string;
  walletState: WalletState;
  onGameComplete: (finalStats: any) => void;
  onGameFailed: () => void;
}

export default function GameInterface({
  username,
  walletState,
  onGameComplete,
  onGameFailed
}: GameInterfaceProps) {
  const [gameState, setGameState] = useState<GameState>({
    level: 'easy',
    questionIndex: 0,
    sessionScore: 0,
    currentSessionQuestions: 0,
    lives: 5,
    hintsUsed: 0,
    totalTime: 0,
    currentQuestions: [],
    showHint: false,
    gameComplete: false,
    failed: false
  });

  const [persistentData, setPersistentData] = useState<PersistentGameData>({
    totalScore: 0,
    totalQuestionsAnswered: 0,
    highestScore: 0,
    totalGamesPlayed: 0,
    averageScore: 0
  });

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [showNoLivesPopup, setShowNoLivesPopup] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Function to handle when lives reach 0
  const handleNoLivesPopup = async () => {
    try {
      if (walletState.address) {
        await FirebaseGameService.loseLife(walletState.address);
      }
      setShowNoLivesPopup(true);
    } catch (error) {
      console.error('Error during no lives handling:', error);
      setShowNoLivesPopup(true);
    }
  };

  // Calculate remaining questions based on total answered
  const getRemainingQuestions = (totalAnswered: number) => {
    return Math.max(0, 20 - totalAnswered);
  };

  // Initialize game and load from Firebase
  useEffect(() => {
    const initializeGame = async () => {
      if (!walletState.address) return;

      try {
        setFirebaseLoading(true);

        // Check if user exists, if not initialize them
        let userData = await FirebaseGameService.getUserGameData(walletState.address);

        if (!userData) {
          // New user - initialize with default values
          userData = await FirebaseGameService.initializeUser(walletState.address, walletState.network || 'mainnet');
        }

        // Get comprehensive stats
        const userStats = await FirebaseGameService.getUserStats(walletState.address);
        const welcome = await FirebaseGameService.getWelcomeMessage(walletState.address);

        setWelcomeMessage(welcome);

        if (userStats) {
          setPersistentData({
            totalScore: userStats.totalScore,
            totalQuestionsAnswered: userStats.totalQuestionsPlayed,
            highestScore: userStats.highestScore,
            totalGamesPlayed: userStats.totalGamesPlayed,
            averageScore: userStats.averageScore
          });

          // Check if user has lives
          if (userStats.lives <= 0) {
            await handleNoLivesPopup();
            return;
          }

          // Check if user has a current session to continue
          if (userStats.currentSessionScore > 0) {
            // Continue existing session
            const remainingQuestions = getRemainingQuestions(userStats.totalQuestionsPlayed);

            if (remainingQuestions > 0) {
              // Determine current level based on progress
              const currentLevel = getCurrentLevel(userStats.totalQuestionsPlayed);

              setGameState(prev => ({
                ...prev,
                lives: userStats.lives,
                sessionScore: userStats.currentSessionScore,
                currentSessionQuestions: userStats.currentSessionQuestions
              }));

              initializeLevel(currentLevel, userStats.totalQuestionsPlayed);
            } else {
              // All questions completed
              handleGameCompletion(userStats);
            }
          } else {
            // Start new session
            const remainingQuestions = getRemainingQuestions(userStats.totalQuestionsPlayed);

            if (remainingQuestions > 0) {
              const startLevel = getCurrentLevel(userStats.totalQuestionsPlayed);

              setGameState(prev => ({
                ...prev,
                lives: userStats.lives,
                sessionScore: 0,
                currentSessionQuestions: 0
              }));

              initializeLevel(startLevel, userStats.totalQuestionsPlayed);
            } else {
              // All questions completed
              handleGameCompletion(userStats);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing game with Firebase:', error);
        // Fallback initialization
        setGameState(prev => ({ ...prev, lives: 5 }));
        initializeLevel('easy', 0);
      } finally {
        setFirebaseLoading(false);
      }
    };

    initializeGame();
  }, [walletState.address]);

  // Determine current level based on total questions answered
  const getCurrentLevel = (totalQuestions: number): 'easy' | 'medium' | 'hard' | 'expert' => {
    if (totalQuestions < 5) return 'easy';
    if (totalQuestions < 10) return 'medium';
    if (totalQuestions < 15) return 'hard';
    return 'expert';
  };

  // Handle game completion
  const handleGameCompletion = async (stats: any) => {
    const finalStats = {
      score: stats.totalScore,
      questionsAnswered: stats.totalQuestionsPlayed,
      totalTime: 0,
      averageTime: 0,
      hintsUsed: 0,
      livesLost: 5 - stats.lives,
      aptReward: (stats.totalScore * 0.01).toFixed(4),
      personalBest: stats.highestScore,
      averageScore: stats.averageScore
    };

    await FirebaseGameService.completeSession(walletState.address!);
    onGameComplete(finalStats);
  };

  // Watch for lives reaching 0 during gameplay
  useEffect(() => {
    if (gameState.lives <= 0 && gameState.currentQuestions.length > 0 && !showNoLivesPopup) {
      handleNoLivesPopup();
    }
  }, [gameState.lives, showNoLivesPopup]);

  // Save progress to Firebase when game state changes
  useEffect(() => {
    const saveToFirebase = async () => {
      if (!walletState.address || firebaseLoading) return;

      try {
        setFirebaseLoading(true);

        // Save current progress (accumulative)
        if (gameState.sessionScore > 0 || gameState.currentSessionQuestions > 0) {
          await FirebaseGameService.updateGameProgress(
            walletState.address,
            0, // No additional score, just update session
            0  // No additional questions, just sync
          );
        }
      } catch (error) {
        console.error('Error saving to Firebase:', error);
      } finally {
        setFirebaseLoading(false);
      }
    };

    // Only save if game has meaningful progress
    if (gameState.currentQuestions.length > 0 && gameState.currentSessionQuestions > 0) {
      const timeoutId = setTimeout(saveToFirebase, 2000); // Debounce saves
      return () => clearTimeout(timeoutId);
    }
  }, [gameState.sessionScore, gameState.currentSessionQuestions, walletState.address]);

  // Handle timeLeft and question resets
  useEffect(() => {
    if (gameState.currentQuestions.length > 0 &&
      gameState.questionIndex < gameState.currentQuestions.length) {
      const currentQuestion = gameState.currentQuestions[gameState.questionIndex];
      if (currentQuestion) {
        setTimeLeft(QUESTION_TIME_LIMIT);
        setCurrentAnswer('');
        setShowResult(false);
        setLoading(false);
        setGameState(prev => ({ ...prev, showHint: false }));
      }
    }
  }, [gameState.questionIndex, gameState.currentQuestions]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showResult && !loading) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult && !loading && gameState.currentQuestions.length > 0) {
      handleWrongAnswer();
    }
  }, [timeLeft, showResult, loading, gameState.currentQuestions.length]);

  const initializeLevel = (level: 'easy' | 'medium' | 'hard' | 'expert', alreadyAnswered: number = 0) => {
    const allQuestions = QUESTION_BANK.filter(q => q.level === level);
    const remainingQuestions = getRemainingQuestions(alreadyAnswered);

    // Shuffle and take questions for this level
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const questionsToTake = Math.min(remainingQuestions, LEVEL_CONFIG[level].questionsPerLevel);
    const selected = shuffled.slice(0, questionsToTake);

    setGameState(prev => ({
      ...prev,
      level,
      currentQuestions: selected,
      questionIndex: 0
    }));
  };

  const handleAnswer = () => {
    if (!currentAnswer.trim() || loading || gameState.currentQuestions.length === 0) return;

    setLoading(true);

    const currentQuestion = gameState.currentQuestions[gameState.questionIndex];
    if (!currentQuestion) {
      setLoading(false);
      return;
    }

    const isAnswerCorrect = currentAnswer.toLowerCase().trim() === currentQuestion.answer;

    setIsCorrect(isAnswerCorrect);
    setShowResult(true);

    // Calculate time-based score
    const timeBonus = Math.max(0, timeLeft / QUESTION_TIME_LIMIT);
    const baseScore = isAnswerCorrect ? 20 : 0;
    const hintPenalty = gameState.showHint ? 3 : 0;
    const questionScore = Math.max(0, Math.round(baseScore * (0.5 + 0.5 * timeBonus) - hintPenalty));

    setTimeout(() => {
      if (isAnswerCorrect) {
        handleCorrectAnswer(questionScore);
      } else {
        handleWrongAnswer();
      }
    }, 3000);
  };

  const handleCorrectAnswer = async (questionScore: number) => {
    const timeSpent = QUESTION_TIME_LIMIT - timeLeft;

    try {
      // Update Firebase immediately with the new progress
      if (walletState.address) {
        await FirebaseGameService.updateGameProgress(
          walletState.address,
          questionScore, // Add this score
          1 // Add one question
        );
      }

      // Update local state
      const newGameState = {
        ...gameState,
        sessionScore: gameState.sessionScore + questionScore,
        currentSessionQuestions: gameState.currentSessionQuestions + 1,
        totalTime: gameState.totalTime + timeSpent,
        hintsUsed: gameState.hintsUsed + (gameState.showHint ? 1 : 0)
      };

      // Update persistent data
      setPersistentData(prev => ({
        ...prev,
        totalScore: prev.totalScore + questionScore,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
        highestScore: Math.max(prev.highestScore, prev.totalScore + questionScore)
      }));

      // Check if all questions completed (20 total)
      const totalAnswered = persistentData.totalQuestionsAnswered + 1;

      if (totalAnswered >= 20) {
        // Game complete
        await FirebaseGameService.completeSession(walletState.address!);

        const finalStats = {
          score: persistentData.totalScore + questionScore,
          questionsAnswered: totalAnswered,
          totalTime: newGameState.totalTime,
          averageTime: newGameState.totalTime / totalAnswered,
          hintsUsed: newGameState.hintsUsed,
          livesLost: 5 - newGameState.lives,
          aptReward: ((persistentData.totalScore + questionScore) * 0.01).toFixed(4),
          personalBest: Math.max(persistentData.highestScore, persistentData.totalScore + questionScore),
          averageScore: Math.round((persistentData.totalScore + questionScore) / (persistentData.totalGamesPlayed + 1))
        };

        onGameComplete(finalStats);
      } else if (gameState.questionIndex + 1 >= gameState.currentQuestions.length) {
        // Current level complete, move to next level
        const levels = ['easy', 'medium', 'hard', 'expert'] as const;
        const currentLevelIndex = levels.indexOf(gameState.level);

        if (currentLevelIndex < levels.length - 1) {
          // Next level
          const nextLevel = levels[currentLevelIndex + 1];
          const remainingQuestions = getRemainingQuestions(totalAnswered);

          if (remainingQuestions > 0) {
            const levelQuestions = QUESTION_BANK.filter(q => q.level === nextLevel);
            const shuffled = [...levelQuestions].sort(() => Math.random() - 0.5);
            const questionsToTake = Math.min(remainingQuestions, LEVEL_CONFIG[nextLevel].questionsPerLevel);
            const selected = shuffled.slice(0, questionsToTake);

            setGameState({
              ...newGameState,
              level: nextLevel,
              currentQuestions: selected,
              questionIndex: 0
            });
          }
        }
      } else {
        // Next question in current level
        setGameState({
          ...newGameState,
          questionIndex: gameState.questionIndex + 1
        });
      }
    } catch (error) {
      console.error('Error handling correct answer:', error);
      // Continue with local state even if Firebase fails
      setGameState({
        ...gameState,
        sessionScore: gameState.sessionScore + questionScore,
        currentSessionQuestions: gameState.currentSessionQuestions + 1,
        questionIndex: gameState.questionIndex + 1
      });
    }

    resetQuestion();
  };

  const handleWrongAnswer = async () => {
    const timeSpent = QUESTION_TIME_LIMIT - timeLeft;

    try {
      const newLives = gameState.lives - 1;

      if (newLives <= 0) {
        // Lose life in Firebase
        if (walletState.address) {
          await FirebaseGameService.loseLife(walletState.address);
        }

        setGameState(prev => ({
          ...prev,
          lives: 0,
          failed: true
        }));
        // The useEffect will handle showing the popup
      } else {
        // Update lives in Firebase
        if (walletState.address) {
          await FirebaseGameService.loseLife(walletState.address);
        }

        // Continue with fewer lives
        const updatedGameState = {
          ...gameState,
          lives: newLives,
          totalTime: gameState.totalTime + timeSpent
        };

        // Move to next question or level
        if (gameState.questionIndex + 1 >= gameState.currentQuestions.length) {
          const remainingQuestions = getRemainingQuestions(persistentData.totalQuestionsAnswered);

          if (remainingQuestions > 0) {
            const levels = ['easy', 'medium', 'hard', 'expert'] as const;
            const currentLevelIndex = levels.indexOf(gameState.level);

            if (currentLevelIndex < levels.length - 1) {
              // Move to next level
              const nextLevel = levels[currentLevelIndex + 1];
              const levelQuestions = QUESTION_BANK.filter(q => q.level === nextLevel);
              const shuffled = [...levelQuestions].sort(() => Math.random() - 0.5);
              const questionsToTake = Math.min(remainingQuestions, LEVEL_CONFIG[nextLevel].questionsPerLevel);
              const selected = shuffled.slice(0, questionsToTake);

              setGameState({
                ...updatedGameState,
                level: nextLevel,
                currentQuestions: selected,
                questionIndex: 0
              });
            }
          } else {
            // All questions completed
            await handleGameCompletion({
              totalScore: persistentData.totalScore,
              totalQuestionsPlayed: persistentData.totalQuestionsAnswered,
              lives: newLives,
              highestScore: persistentData.highestScore,
              averageScore: persistentData.averageScore,
              totalGamesPlayed: persistentData.totalGamesPlayed
            });
          }
        } else {
          // Next question
          setGameState({
            ...updatedGameState,
            questionIndex: gameState.questionIndex + 1
          });
        }
      }
    } catch (error) {
      console.error('Error handling wrong answer:', error);
      // Continue with local state
      setGameState(prev => ({
        ...prev,
        lives: Math.max(0, prev.lives - 1),
        questionIndex: prev.questionIndex + 1
      }));
    }

    resetQuestion();
  };

  const resetQuestion = () => {
    setShowResult(false);
    setLoading(false);
  };

  const handleShowHint = () => {
    setGameState(prev => ({ ...prev, showHint: true }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnswer();
    }
  };

  // Early return if no lives popup is showing
  if (showNoLivesPopup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center border-red-500">
            <div className="text-6xl mb-6 text-red-500">
              <Skull />
            </div>
            <div className="gothic-text text-3xl mb-4 text-red-500">
              NO LIVES REMAINING
            </div>
            <div className="terminal-text text-base mb-6 opacity-80">
              The Phantom Ledger has drained your life force.
              <br />
              <br />
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>Questions: {persistentData.totalQuestionsAnswered}/20</div>
                <div>Score: {gameState.currentGameScore} PTS</div>
              </div>
              <br />
              All progress is preserved. Your session will continue when you return.
            </div>
            <div className="terminal-text text-sm opacity-60 mb-4">
              Lives regenerate over time or can be purchased with APT tokens.
            </div>
            <Button
              onClick={() => {
                setShowNoLivesPopup(false);
                onGameFailed();
              }}
              className="bg-red-600 hover:bg-red-700 text-white terminal-text px-8"
            >
              RETURN TO MENU
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Early return if lives are 0 but popup hasn't shown yet
  if (gameState.lives <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6 text-red-500">
            <Skull />
          </div>
          <div className="gothic-text text-2xl mb-4 text-red-500">
            LIFE FORCE DEPLETED
          </div>
          <div className="terminal-text text-sm opacity-80">
            Processing life force depletion...
            <br />
            Progress preserved: {gameState.sessionScore} PTS
          </div>
          <div className="w-12 h-12 border-4 border-white rotating-loader mx-auto mt-6"></div>
        </Card>
      </div>
    );
  }

  if (gameState.currentQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-white rotating-loader mx-auto mb-4"></div>
          <div className="terminal-text text-sm opacity-80">
            Accessing the Phantom Ledger...
            {welcomeMessage && (
              <div className="mt-4 text-left whitespace-pre-line">
                {welcomeMessage}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = gameState.currentQuestions[gameState.questionIndex];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white rotating-loader"></div>
      </div>
    );
  }

  const progress = (persistentData.totalQuestionsAnswered / 20) * 100;

  if (showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center">
          <div className={`text-6xl mb-6 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isCorrect ? <Trophy /> : <Skull />}
          </div>
          <div className="gothic-text text-2xl mb-4">
            {isCorrect ? 'CIPHER DECODED' : 'INCORRECT CIPHER'}
          </div>
          <div className="terminal-text text-sm opacity-80 mb-4">
            {isCorrect ? 'The Phantom Ledger accepts your wisdom...' : 'The Phantom Ledger rejects your offering...'}
          </div>
          {isCorrect && (
            <div className="terminal-text text-sm text-green-400 mb-4">
              Progress: {persistentData.totalQuestionsAnswered + 1}/20 questions
              <br />
              Total Score: {persistentData.totalScore + gameState.sessionScore} PTS
            </div>
          )}
          <div className="w-12 h-12 border-4 border-white rotating-loader mx-auto"></div>
          {firebaseLoading && (
            <div className="terminal-text text-xs opacity-60 mt-2">
              Syncing to blockchain...
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <Card className="cryptic-border bg-black p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="terminal-text text-lg">{username}</div>
            <Badge variant="outline" className="border-white text-white">
              {walletManager.formatAddress(walletState.address!)}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Coins size={16} />
                <span className="terminal-text text-sm">{gameState.sessionScore} PTS</span>
              </div>
              {gameState.sessionScore > 0 && (
                <div className="flex items-center gap-1 text-green-400">
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart
                  key={i}
                  size={20}
                  className={i < gameState.lives ? 'text-red-500 fill-current' : 'text-gray-600'}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Timer size={16} />
              <span className="terminal-text text-lg font-bold cyber-glow">
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm terminal-text mb-2">
            <span>Progress: {persistentData.totalQuestionsAnswered}/20</span>
            <span>Level: {LEVEL_CONFIG[gameState.level].name}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Question */}
      <Card className="cryptic-border bg-black p-8 mb-6">
        <div className="space-y-6">
          {/* Story */}
          <div className="terminal-text text-sm opacity-80 italic text-center p-4 border border-gray-700 rounded">
            {currentQuestion.story}
          </div>

          {/* Question */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain size={24} />
              <span className="gothic-text text-xl">CIPHER #{persistentData.totalQuestionsAnswered + 1}</span>
            </div>
            <div className="terminal-text text-lg leading-relaxed">
              {currentQuestion.question}
            </div>
          </div>

          {/* Hint */}
          {gameState.showHint && currentQuestion.hints && (
            <div className="cryptic-border bg-yellow-900/20 p-4 rounded text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lightbulb size={16} className="text-yellow-500" />
                <span className="terminal-text text-sm text-yellow-500">HINT REVEALED (-3 POINTS)</span>
              </div>
              <div className="terminal-text text-sm opacity-80">
                {currentQuestion.hints[0]}
              </div>
            </div>
          )}

          {/* Answer Input */}
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="enter cipher solution..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value.toLowerCase())}
              onKeyPress={handleKeyPress}
              className="bg-black border-white text-white terminal-text text-center text-lg terminal-cursor"
              disabled={loading}
            />

            <div className="flex justify-center gap-4">
              {!gameState.showHint && currentQuestion.hints && (
                <Button
                  onClick={handleShowHint}
                  variant="outline"
                  className="terminal-text"
                  disabled={loading}
                >
                  <Lightbulb className="mr-2" size={16} />
                  REVEAL HINT (-3 PTS)
                </Button>
              )}

              <Button
                onClick={handleAnswer}
                disabled={!currentAnswer.trim() || loading}
                className="bg-white text-black hover:bg-gray-200 terminal-text px-8"
              >
                SUBMIT CIPHER
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center terminal-text text-xs opacity-60">
        The Phantom Ledger observes your progress...
        <br />
        Answer carefully - each mistake costs precious life force.
        {gameState.failed && (
          <>
            <br />
            <span className="text-yellow-400">Previous session ended - progress preserved</span>
          </>
        )}
        {firebaseLoading && (
          <>
            <br />
            <span className="text-blue-400">Syncing game state...</span>
          </>
        )}
      </div>
    </div>
  );
}