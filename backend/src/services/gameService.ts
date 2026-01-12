import prisma from '../utils/db';
import { Language, QuestionDifficulty } from '@prisma/client';

interface QuestionSelectionOptions {
  language: Language;
  difficulty?: QuestionDifficulty;
  eloRating?: number;
  count: number;
  isBattleMode?: boolean;
}

interface AnswerData {
  answer: string;
  timeMs: number;
  correct: boolean;
}

interface GameResult {
  userId: string;
  correctAnswers: number;
  totalTimeMs: number;
  score: number;
}

/**
 * Game Service
 * Handles game logic, question selection, and winner determination
 */
class GameService {
  /**
   * Get difficulty level based on ELO rating for battle mode
   * Beginner: EASY only
   * Mid-ladder: EASY to MEDIUM
   * High-ELO: MEDIUM to HARD
   * Top percent: HARD only
   */
  getDifficultyFromElo(eloRating: number): QuestionDifficulty[] {
    if (eloRating < 1100) {
      // Beginner (Bronze and below)
      return [QuestionDifficulty.EASY];
    } else if (eloRating < 1700) {
      // Mid-ladder (Silver to Gold)
      return [QuestionDifficulty.EASY, QuestionDifficulty.MEDIUM];
    } else if (eloRating < 2300) {
      // High-ELO (Platinum to Diamond)
      return [QuestionDifficulty.MEDIUM, QuestionDifficulty.HARD];
    } else {
      // Top percent (Master and above)
      return [QuestionDifficulty.HARD];
    }
  }

  /**
   * Select questions for a match based on options
   */
  async selectQuestions(options: QuestionSelectionOptions) {
    const { language, difficulty, eloRating, count, isBattleMode } = options;

    // Determine difficulty levels to select from
    let difficulties: QuestionDifficulty[];
    if (difficulty) {
      // Custom lobby - use specified difficulty
      difficulties = [difficulty];
    } else if (isBattleMode && eloRating !== undefined) {
      // Battle mode - use ELO-based difficulty
      difficulties = this.getDifficultyFromElo(eloRating);
    } else {
      // Default to all difficulties
      difficulties = [
        QuestionDifficulty.EASY,
        QuestionDifficulty.MEDIUM,
        QuestionDifficulty.HARD,
      ];
    }

    // Get total question count for this language and difficulties
    const totalQuestions = await prisma.question.count({
      where: {
        language,
        difficulty: { in: difficulties },
      },
    });

    if (totalQuestions === 0) {
      throw new Error(`No questions available for ${language}`);
    }

    // For battle mode, always use 5 questions
    const questionCount = isBattleMode ? 5 : count;

    // Generate random offsets
    const randomOffsets = new Set<number>();
    while (randomOffsets.size < Math.min(questionCount, totalQuestions)) {
      randomOffsets.add(Math.floor(Math.random() * totalQuestions));
    }

    // Fetch questions at random positions
    const questions = await Promise.all(
      Array.from(randomOffsets).map((offset) =>
        prisma.question.findMany({
          where: {
            language,
            difficulty: { in: difficulties },
          },
          take: 1,
          skip: offset,
        })
      )
    );

    return questions.flat();
  }

  /**
   * Calculate match results and determine winner
   * Winner is determined by:
   * 1. Most correct answers
   * 2. If tied, fastest total time
   * 3. If still tied, it's a draw
   */
  determineWinner(
    results: Array<{
      userId: string;
      answers: Record<string, AnswerData>;
      correctAnswers: number;
      totalTimeMs: number;
    }>
  ): {
    winnerId: string | null;
    isDraw: boolean;
    results: GameResult[];
  } {
    // Calculate scores and sort results
    const gameResults: GameResult[] = results.map((result) => ({
      userId: result.userId,
      correctAnswers: result.correctAnswers,
      totalTimeMs: result.totalTimeMs,
      score: result.correctAnswers * 10, // 10 points per correct answer
    }));

    // Sort by correct answers (descending), then by time (ascending)
    gameResults.sort((a, b) => {
      // Primary: Most correct answers wins
      if (a.correctAnswers !== b.correctAnswers) {
        return b.correctAnswers - a.correctAnswers;
      }
      // Secondary: Fastest time wins
      if (a.totalTimeMs !== b.totalTimeMs) {
        return a.totalTimeMs - b.totalTimeMs;
      }
      // Tertiary: Draw
      return 0;
    });

    // Determine winner
    const topResult = gameResults[0];
    let winnerId: string | null = topResult.userId;
    let isDraw = false;

    // Check if it's a draw (same correct answers and same time)
    if (gameResults.length > 1) {
      const secondResult = gameResults[1];
      if (
        topResult.correctAnswers === secondResult.correctAnswers &&
        topResult.totalTimeMs === secondResult.totalTimeMs
      ) {
        winnerId = null;
        isDraw = true;
      }
    }

    return {
      winnerId,
      isDraw,
      results: gameResults,
    };
  }

  /**
   * Validate and process submitted answers
   */
  async processAnswers(
    matchId: string,
    userId: string,
    answers: Record<string, { answer: string; timeMs: number }>
  ): Promise<{
    correctAnswers: number;
    totalTimeMs: number;
    processedAnswers: Record<string, AnswerData>;
    score: number;
  }> {
    // Get match questions
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { questions: true },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const questions = match.questions as Array<{
      id: string;
      question: string;
      options: string[];
      type: string;
    }>;

    // Fetch correct answers from database
    const questionIds = questions.map((q) => q.id);
    const dbQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true },
    });

    const correctAnswersMap = new Map(
      dbQuestions.map((q) => [q.id, q.correctAnswer])
    );

    // Process each answer
    let correctAnswers = 0;
    let totalTimeMs = 0;
    const processedAnswers: Record<string, AnswerData> = {};

    for (const [questionId, answerData] of Object.entries(answers)) {
      const correctAnswer = correctAnswersMap.get(questionId);
      const isCorrect = answerData.answer === correctAnswer;

      if (isCorrect) {
        correctAnswers++;
      }

      totalTimeMs += answerData.timeMs;

      processedAnswers[questionId] = {
        answer: answerData.answer,
        timeMs: answerData.timeMs,
        correct: isCorrect,
      };
    }

    const score = correctAnswers * 10; // 10 points per correct answer

    return {
      correctAnswers,
      totalTimeMs,
      processedAnswers,
      score,
    };
  }

  /**
   * Get or create language stats for a user
   */
  async getOrCreateLanguageStats(userId: string, language: Language) {
    let stats = await prisma.languageStats.findUnique({
      where: {
        userId_language: {
          userId,
          language,
        },
      },
    });

    if (!stats) {
      const { getDivisionFromElo } = await import('../utils/division');
      const startingElo = 1000;
      const divisionInfo = getDivisionFromElo(startingElo);

      stats = await prisma.languageStats.create({
        data: {
          userId,
          language,
          eloRating: startingElo,
          division: divisionInfo.division,
        },
      });
    }

    return stats;
  }

  /**
   * Update language-specific stats after a match
   */
  async updateLanguageStats(
    userId: string,
    language: Language,
    eloChange: number,
    result: 'win' | 'loss' | 'draw'
  ) {
    const stats = await this.getOrCreateLanguageStats(userId, language);
    const newElo = Math.max(0, stats.eloRating + eloChange);

    // Determine division from new ELO
    const { getDivisionFromElo } = await import('../utils/division');
    const divisionInfo = getDivisionFromElo(newElo);

    // Update stats
    await prisma.languageStats.update({
      where: {
        userId_language: {
          userId,
          language,
        },
      },
      data: {
        eloRating: newElo,
        division: divisionInfo.division,
        totalMatches: { increment: 1 },
        wins: result === 'win' ? { increment: 1 } : undefined,
        losses: result === 'loss' ? { increment: 1 } : undefined,
        draws: result === 'draw' ? { increment: 1 } : undefined,
      },
    });

    return {
      newElo,
      oldElo: stats.eloRating,
      newDivision: divisionInfo.division,
      oldDivision: stats.division,
      divisionChanged: divisionInfo.division !== stats.division,
    };
  }
}

export const gameService = new GameService();
