// lib/firebase-game.ts
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/init";

export interface UserGameData {
  address: string;
  network: string;
  lives: number;
  totalGamesPlayed: number;
  totalScore: number;
  totalQuestionsPlayed: number; // New field to track questions
  createdAt: any;
  lastConnected: any;
  currentGameScore: number; // Persistent current session score
  currentSessionQuestions: number; // Track questions in current session
  highestScore: number; // Track personal best
  averageScore: number; // Calculate average performance
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  explanation?: string;
}

export class FirebaseGameService {
  private static getUserDocRef(walletAddress: string) {
    return doc(db, "users", walletAddress);
  }

  /**
   * Get user's current game data
   */
  static async getUserGameData(
    walletAddress: string
  ): Promise<UserGameData | null> {
    try {
      const userRef = this.getUserDocRef(walletAddress);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserGameData;

        // Calculate average score for display
        const averageScore =
          data.totalGamesPlayed > 0
            ? Math.round(data.totalScore / data.totalGamesPlayed)
            : 0;

        return {
          ...data,
          averageScore,
          // Ensure all fields have default values
          currentGameScore: data.currentGameScore || 0,
          currentSessionQuestions: data.currentSessionQuestions || 0,
          totalQuestionsPlayed: data.totalQuestionsPlayed || 0,
          highestScore: data.highestScore || 0,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting user game data:", error);
      throw error;
    }
  }

  /**
   * Initialize new user with starting values (only called once)
   */
  static async initializeUser(
    walletAddress: string,
    network: string,
    startingLives: number = 5
  ): Promise<UserGameData> {
    try {
      const userRef = this.getUserDocRef(walletAddress);

      const initialData: UserGameData = {
        address: walletAddress,
        network,
        lives: startingLives,
        totalGamesPlayed: 0,
        totalScore: 0,
        totalQuestionsPlayed: 0,
        currentGameScore: 0,
        currentSessionQuestions: 0,
        highestScore: 0,
        averageScore: 0,
        createdAt: serverTimestamp(),
        lastConnected: serverTimestamp(),
      };

      await setDoc(userRef, initialData);
      console.log("User initialized successfully");

      return initialData;
    } catch (error) {
      console.error("Error initializing user:", error);
      throw error;
    }
  }

  /**
   * Update game progress - accumulate everything, never reset
   */
  static async updateGameProgress(
    walletAddress: string,
    additionalScore: number,
    questionsAnswered: number = 1
  ): Promise<void> {
    try {
      const userRef = this.getUserDocRef(walletAddress);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as UserGameData;

        const newCurrentScore =
          (currentData.currentGameScore || 0) + additionalScore;
        const newCurrentQuestions =
          (currentData.currentSessionQuestions || 0) + questionsAnswered;
        const newTotalQuestions =
          (currentData.totalQuestionsPlayed || 0) + questionsAnswered;
        const newHighestScore = Math.max(
          currentData.highestScore || 0,
          newCurrentScore
        );

        await updateDoc(userRef, {
          currentGameScore: newCurrentScore,
          currentSessionQuestions: newCurrentQuestions,
          totalQuestionsPlayed: newTotalQuestions,
          highestScore: newHighestScore,
          lastConnected: serverTimestamp(),
        });

        console.log(
          `Progress updated: +${additionalScore} points, +${questionsAnswered} questions`
        );
      }
    } catch (error) {
      console.error("Error updating game progress:", error);
      throw error;
    }
  }

  /**
   * Complete current session - move current session to totals, keep current session active
   */
  static async completeSession(walletAddress: string): Promise<void> {
    try {
      const userRef = this.getUserDocRef(walletAddress);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as UserGameData;

        const newTotalScore =
          (currentData.totalScore || 0) + (currentData.currentGameScore || 0);
        const newTotalGames = (currentData.totalGamesPlayed || 0) + 1;
        const newAverageScore = Math.round(newTotalScore / newTotalGames);

        await updateDoc(userRef, {
          totalGamesPlayed: newTotalGames,
          totalScore: newTotalScore,
          averageScore: newAverageScore,
          // Keep current session data - don't reset
          lastConnected: serverTimestamp(),
        });

        console.log(
          "Session completed - data moved to totals, current session preserved"
        );
      }
    } catch (error) {
      console.error("Error completing session:", error);
      throw error;
    }
  }

  /**
   * Lose a life but keep all progress
   */
  static async loseLife(walletAddress: string): Promise<void> {
    try {
      const userRef = this.getUserDocRef(walletAddress);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as UserGameData;

        await updateDoc(userRef, {
          lives: Math.max(0, (currentData.lives || 0) - 1),
          // Keep all scores and progress - never reset
          lastConnected: serverTimestamp(),
        });

        console.log("Life lost - all progress preserved");
      }
    } catch (error) {
      console.error("Error losing life:", error);
      throw error;
    }
  }

  /**
   * Add lives (for purchases, rewards, etc.)
   */
  static async addLives(
    walletAddress: string,
    livesToAdd: number = 1
  ): Promise<void> {
    try {
      const userRef = this.getUserDocRef(walletAddress);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as UserGameData;

        await updateDoc(userRef, {
          lives: (currentData.lives || 0) + livesToAdd,
          lastConnected: serverTimestamp(),
        });

        console.log(`Added ${livesToAdd} lives successfully`);
      }
    } catch (error) {
      console.error("Error adding lives:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive user stats for display
   */
  static async getUserStats(walletAddress: string): Promise<{
    totalScore: number;
    currentSessionScore: number;
    totalGamesPlayed: number;
    totalQuestionsPlayed: number;
    currentSessionQuestions: number;
    averageScore: number;
    highestScore: number;
    lives: number;
    questionsPerGame: number;
  } | null> {
    try {
      const userData = await this.getUserGameData(walletAddress);

      if (!userData) return null;

      const questionsPerGame =
        userData.totalGamesPlayed > 0
          ? Math.round(
              userData.totalQuestionsPlayed / userData.totalGamesPlayed
            )
          : 0;

      return {
        totalScore: userData.totalScore,
        currentSessionScore: userData.currentGameScore,
        totalGamesPlayed: userData.totalGamesPlayed,
        totalQuestionsPlayed: userData.totalQuestionsPlayed,
        currentSessionQuestions: userData.currentSessionQuestions,
        averageScore: userData.averageScore,
        highestScore: userData.highestScore,
        lives: userData.lives,
        questionsPerGame,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }

  

  // Add this method to your FirebaseGameService
  static async getQuestions(): Promise<QuizQuestion[]> {
    try {
      const questionsRef = collection(db, "questions");
      const snapshot = await getDocs(questionsRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizQuestion[];
    } catch (error) {
      console.error("Error fetching questions:", error);
      return [];
    }
  }

  /**
   * Get login welcome message with accumulated progress
   */
  static async getWelcomeMessage(walletAddress: string): Promise<string> {
    try {
      const stats = await this.getUserStats(walletAddress);

      if (!stats) {
        return "Welcome to the game! Starting your journey...";
      }

      const messages = [
        `Welcome back! 🎮`,
        `Lives: ${stats.lives}`,
        `Current Session: ${stats.currentSessionScore} points (${stats.currentSessionQuestions} questions)`,
        `Total Progress: ${stats.totalScore} points across ${stats.totalGamesPlayed} games`,
        `Questions Answered: ${stats.totalQuestionsPlayed} total`,
        `Personal Best: ${stats.highestScore} points`,
        `Average: ${stats.averageScore} points per game`,
      ];

      if (stats.currentSessionScore > 0) {
        messages.push(
          `🔥 Continue your current session with ${stats.currentSessionScore} points!`
        );
      }

      return messages.join("\n");
    } catch (error) {
      console.error("Error generating welcome message:", error);
      return "Welcome back to the game!";
    }
  }
}