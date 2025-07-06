"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { walletManager, WalletState } from '@/lib/wallet';
import { FirebaseGameService } from '@/lib/firebase-game';
import {
  Heart,
  Timer,
  Brain,
  Skull,
  Trophy,
  Coins,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Fixed time limit: 20 minutes (1200 seconds)
const QUESTION_TIME_LIMIT = 1200;

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  isActive: boolean;
  createdAt: any;
}

interface GameState {
  questionIndex: number;
  sessionScore: number;
  currentSessionQuestions: number;
  lives: number;
  totalTime: number;
  currentQuestions: QuizQuestion[];
  gameComplete: boolean;
  failed: boolean;
  selectedAnswer: number | null;
  showResult: boolean;
  isCorrect: boolean;
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
    questionIndex: 0,
    sessionScore: 0,
    currentSessionQuestions: 0,
    lives: 5,
    totalTime: 0,
    currentQuestions: [],
    gameComplete: false,
    failed: false,
    selectedAnswer: null,
    showResult: false,
    isCorrect: false
  });

  const [persistentData, setPersistentData] = useState<PersistentGameData>({
    totalScore: 0,
    totalQuestionsAnswered: 0,
    highestScore: 0,
    totalGamesPlayed: 0,
    averageScore: 0
  });

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [loading, setLoading] = useState(false);
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [showNoLivesPopup, setShowNoLivesPopup] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Function to fetch questions from Firebase
  const fetchQuestionsFromFirebase = async (): Promise<QuizQuestion[]> => {
    try {
      // This would be your Firebase function to fetch questions
      // Replace with actual Firebase questions collection fetch
      const questionsSnapshot = await FirebaseGameService.getQuestions();
      return (questionsSnapshot || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isActive: q.isActive ?? true,
        createdAt: q.createdAt ?? null
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  };

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
              setGameState(prev => ({
                ...prev,
                lives: userStats.lives,
                sessionScore: userStats.currentSessionScore,
                currentSessionQuestions: userStats.currentSessionQuestions
              }));

              await initializeQuestions(remainingQuestions);
            } else {
              // All questions completed
              handleGameCompletion(userStats);
            }
          } else {
            // Start new session
            const remainingQuestions = getRemainingQuestions(userStats.totalQuestionsPlayed);

            if (remainingQuestions > 0) {
              setGameState(prev => ({
                ...prev,
                lives: userStats.lives,
                sessionScore: 0,
                currentSessionQuestions: 0
              }));

              await initializeQuestions(remainingQuestions);
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
        await initializeQuestions(20);
      } finally {
        setFirebaseLoading(false);
      }
    };

    initializeGame();
  }, [walletState.address]);

  // Initialize questions from Firebase
  const initializeQuestions = async (questionsNeeded: number) => {
    try {
      const allQuestions = await fetchQuestionsFromFirebase();
      const activeQuestions = allQuestions.filter(q => q.isActive);

      // Shuffle and select questions
      const shuffled = [...activeQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionsNeeded, shuffled.length));

      setGameState(prev => ({
        ...prev,
        currentQuestions: selected,
        questionIndex: 0
      }));
    } catch (error) {
      console.error('Error initializing questions:', error);
      // Fallback - could show error message
    }
  };

  // Handle game completion
  const handleGameCompletion = async (stats: any) => {
    const finalStats = {
      score: stats.totalScore,
      questionsAnswered: stats.totalQuestionsPlayed,
      totalTime: 0,
      averageTime: 0,
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

    if (gameState.currentQuestions.length > 0 && gameState.currentSessionQuestions > 0) {
      const timeoutId = setTimeout(saveToFirebase, 2000);
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
        setGameState(prev => ({
          ...prev,
          selectedAnswer: null,
          showResult: false,
          isCorrect: false
        }));
        setLoading(false);
      }
    }
  }, [gameState.questionIndex, gameState.currentQuestions]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !gameState.showResult && !loading) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameState.showResult && !loading && gameState.currentQuestions.length > 0) {
      handleWrongAnswer();
    }
  }, [timeLeft, gameState.showResult, loading, gameState.currentQuestions.length]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (loading || gameState.showResult) return;

    setGameState(prev => ({ ...prev, selectedAnswer: answerIndex }));
  };

  const handleSubmitAnswer = () => {
    if (gameState.selectedAnswer === null || loading || gameState.currentQuestions.length === 0) return;

    setLoading(true);

    const currentQuestion = gameState.currentQuestions[gameState.questionIndex];
    if (!currentQuestion) {
      setLoading(false);
      return;
    }

    const isAnswerCorrect = gameState.selectedAnswer === currentQuestion.correctAnswer;
    const questionScore = isAnswerCorrect ? 3 : 0; // 3 points for correct answer

    setGameState(prev => ({
      ...prev,
      isCorrect: isAnswerCorrect,
      showResult: true
    }));

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
          questionScore,
          1
        );
      }

      // Update local state
      const newGameState = {
        ...gameState,
        sessionScore: gameState.sessionScore + questionScore,
        currentSessionQuestions: gameState.currentSessionQuestions + 1,
        totalTime: gameState.totalTime + timeSpent
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
          livesLost: 5 - newGameState.lives,
          aptReward: ((persistentData.totalScore + questionScore) * 0.01).toFixed(4),
          personalBest: Math.max(persistentData.highestScore, persistentData.totalScore + questionScore),
          averageScore: Math.round((persistentData.totalScore + questionScore) / (persistentData.totalGamesPlayed + 1))
        };

        onGameComplete(finalStats);
      } else if (gameState.questionIndex + 1 >= gameState.currentQuestions.length) {
        // Need more questions
        const remainingQuestions = getRemainingQuestions(totalAnswered);
        if (remainingQuestions > 0) {
          await initializeQuestions(remainingQuestions);
        }
      } else {
        // Next question
        setGameState({
          ...newGameState,
          questionIndex: gameState.questionIndex + 1
        });
      }
    } catch (error) {
      console.error('Error handling correct answer:', error);
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
        if (walletState.address) {
          await FirebaseGameService.loseLife(walletState.address);
        }

        setGameState(prev => ({
          ...prev,
          lives: 0,
          failed: true
        }));
      } else {
        if (walletState.address) {
          await FirebaseGameService.loseLife(walletState.address);
        }

        const updatedGameState = {
          ...gameState,
          lives: newLives,
          totalTime: gameState.totalTime + timeSpent
        };

        if (gameState.questionIndex + 1 >= gameState.currentQuestions.length) {
          const remainingQuestions = getRemainingQuestions(persistentData.totalQuestionsAnswered);
          if (remainingQuestions > 0) {
            await initializeQuestions(remainingQuestions);
          } else {
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
          setGameState({
            ...updatedGameState,
            questionIndex: gameState.questionIndex + 1
          });
        }
      }
    } catch (error) {
      console.error('Error handling wrong answer:', error);
      setGameState(prev => ({
        ...prev,
        lives: Math.max(0, prev.lives - 1),
        questionIndex: prev.questionIndex + 1
      }));
    }

    resetQuestion();
  };

  const resetQuestion = () => {
    setGameState(prev => ({
      ...prev,
      showResult: false,
      selectedAnswer: null,
      isCorrect: false
    }));
    setLoading(false);
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
                <div>Score: {gameState.sessionScore} PTS</div>
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
            Loading questions from the Phantom Ledger...
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

  if (gameState.showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="cryptic-border bg-black p-8 max-w-md w-full text-center">
          <div className={`text-6xl mb-6 ${gameState.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {gameState.isCorrect ? <CheckCircle /> : <XCircle />}
          </div>
          <div className="gothic-text text-2xl mb-4">
            {gameState.isCorrect ? 'CORRECT!' : 'INCORRECT!'}
          </div>
          <div className="terminal-text text-sm opacity-80 mb-4">
            {gameState.isCorrect ? 'You earned 3 points!' : 'You lost a life!'}
          </div>
          {currentQuestion.explanation && (
            <div className="terminal-text text-sm mb-4 p-3 bg-gray-800 rounded">
              <strong>Explanation:</strong> {currentQuestion.explanation}
            </div>
          )}
          {gameState.isCorrect && (
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
            <span>3 points per question</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Question */}
      <Card className="cryptic-border bg-black p-8 mb-6">
        <div className="space-y-6">
          {/* Question */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain size={24} />
              <span className="gothic-text text-xl">QUESTION #{persistentData.totalQuestionsAnswered + 1}</span>
            </div>
            <div className="terminal-text text-lg leading-relaxed">
              {currentQuestion.question}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                variant={gameState.selectedAnswer === index ? "default" : "outline"}
                className={`w-full text-left p-4 h-auto ${gameState.selectedAnswer === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-transparent border-white text-white hover:bg-gray-800'
                  }`}
                disabled={loading}
              >
                <span className="terminal-text">
                  {String.fromCharCode(65 + index)}. {option}
                </span>
              </Button>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmitAnswer}
              disabled={gameState.selectedAnswer === null || loading}
              className="bg-white text-black hover:bg-gray-200 terminal-text px-8"
            >
              SUBMIT ANSWER
            </Button>
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