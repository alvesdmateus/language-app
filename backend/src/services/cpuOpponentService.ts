import prisma from '../utils/db';
import { Language, QuestionDifficulty } from '@prisma/client';
import { Question } from '@prisma/client';

interface CPUOpponent {
  id: string;
  username: string;
  displayName: string;
  eloRating: number;
}

interface CPUAnswer {
  answer: string;
  timeMs: number;
  correct: boolean;
}

interface CPUMatchResult {
  score: number;
  correctAnswers: number;
  totalTimeMs: number;
  answers: Record<string, CPUAnswer>;
}

class CPUOpponentService {
  private readonly CPU_ID = 'cpu-training-bot';
  private readonly CPU_USERNAME = 'TrainingBot';
  private readonly CPU_DISPLAY_NAME = 'Training Bot 🤖';
  private readonly CPU_ELO = 800; // Below starting ELO (1000)

  // CPU accuracy: 60-70% for beginner-friendly experience
  private readonly CPU_ACCURACY_MIN = 0.60;
  private readonly CPU_ACCURACY_MAX = 0.70;

  // CPU timing: 5-35 seconds per question
  private readonly CPU_TIME_MIN_MS = 5000;
  private readonly CPU_TIME_MAX_MS = 35000;

  /**
   * Get CPU opponent data
   */
  getCPUOpponent(): CPUOpponent {
    return {
      id: this.CPU_ID,
      username: this.CPU_USERNAME,
      displayName: this.CPU_DISPLAY_NAME,
      eloRating: this.CPU_ELO,
    };
  }

  /**
   * Generate CPU answers for a set of questions
   * CPU will get 60-70% correct with randomized timing
   */
  generateCPUAnswers(questions: any[]): CPUMatchResult {
    const accuracy = this.getRandomAccuracy();
    const targetCorrect = Math.floor(questions.length * accuracy);

    let correctAnswers = 0;
    let totalTimeMs = 0;
    const answers: Record<string, CPUAnswer> = {};

    questions.forEach((question, index) => {
      const questionId = question.id;
      const correctAnswer = question.correctAnswer;
      const options = question.options as string[];

      // Determine if CPU should answer correctly
      // Distribute correct answers throughout the match
      const shouldBeCorrect = correctAnswers < targetCorrect &&
        (Math.random() < 0.7 || (questions.length - index) <= (targetCorrect - correctAnswers));

      let cpuAnswer: string;
      if (shouldBeCorrect) {
        cpuAnswer = correctAnswer;
        correctAnswers++;
      } else {
        // Pick a random wrong answer
        const wrongOptions = options.filter(opt => opt !== correctAnswer);
        cpuAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      }

      // Generate realistic answer time (faster for easier questions)
      const timeMs = this.generateAnswerTime(question.difficulty);
      totalTimeMs += timeMs;

      answers[questionId] = {
        answer: cpuAnswer,
        timeMs,
        correct: cpuAnswer === correctAnswer,
      };
    });

    // Calculate score (10 points per correct answer)
    const score = correctAnswers * 10;

    return {
      score,
      correctAnswers,
      totalTimeMs,
      answers,
    };
  }

  /**
   * Get random accuracy within CPU range
   */
  private getRandomAccuracy(): number {
    return this.CPU_ACCURACY_MIN +
      Math.random() * (this.CPU_ACCURACY_MAX - this.CPU_ACCURACY_MIN);
  }

  /**
   * Generate realistic answer time based on difficulty
   */
  private generateAnswerTime(difficulty?: string): number {
    let minTime = this.CPU_TIME_MIN_MS;
    let maxTime = this.CPU_TIME_MAX_MS;

    // Adjust time ranges based on difficulty
    if (difficulty === 'EASY') {
      minTime = 5000;
      maxTime = 20000;
    } else if (difficulty === 'MEDIUM') {
      minTime = 10000;
      maxTime = 30000;
    } else if (difficulty === 'HARD') {
      minTime = 15000;
      maxTime = 35000;
    }

    return Math.floor(minTime + Math.random() * (maxTime - minTime));
  }

  /**
   * Create a CPU match for onboarding
   */
  async createCPUMatch(userId: string, language: Language): Promise<any> {
    // Get 5 easy questions for the first battle
    const questions = await prisma.question.findMany({
      where: {
        language,
        difficulty: QuestionDifficulty.EASY,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (questions.length < 5) {
      throw new Error('Not enough questions available for CPU match');
    }

    // Create match in database
    const match = await prisma.match.create({
      data: {
        type: 'BATTLE',
        status: 'IN_PROGRESS',
        language,
        isBattleMode: true,
        isAsync: false,
        isCPUMatch: true, // Mark as CPU match
        questionDuration: 45,
        difficulty: QuestionDifficulty.EASY,
        powerUpsEnabled: false,
        startedAt: new Date(),
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          type: q.type,
          difficulty: q.difficulty,
        })),
        participants: {
          connect: [{ id: userId }],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            displayName: true,
            eloRating: true,
            division: true,
          },
        },
      },
    });

    // Generate CPU answers
    const cpuResult = this.generateCPUAnswers(questions);

    // Store CPU answers in a temporary location (we'll use this when user submits)
    // For now, we'll create a match result for the CPU immediately
    await prisma.matchResult.create({
      data: {
        matchId: match.id,
        userId: this.CPU_ID, // Special CPU user ID
        score: cpuResult.score,
        correctAnswers: cpuResult.correctAnswers,
        totalTimeMs: cpuResult.totalTimeMs,
        answers: cpuResult.answers as any,
      },
    });

    return {
      ...match,
      cpuOpponent: this.getCPUOpponent(),
    };
  }

  /**
   * Complete a CPU match when user submits their answers
   */
  async completeCPUMatch(
    matchId: string,
    userId: string,
    userAnswers: Record<string, { answer: string; timeMs: number }>
  ): Promise<any> {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        results: true,
      },
    });

    if (!match || !match.isCPUMatch) {
      throw new Error('Invalid CPU match');
    }

    // Get CPU result
    const cpuResult = match.results.find(r => r.userId === this.CPU_ID);
    if (!cpuResult) {
      throw new Error('CPU result not found');
    }

    // Calculate user score
    const questions = match.questions as any[];
    let userScore = 0;
    let userCorrect = 0;
    let userTotalTime = 0;

    const processedAnswers: Record<string, any> = {};

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer?.answer === question.correctAnswer;

      if (isCorrect) {
        userScore += 10;
        userCorrect++;
      }

      userTotalTime += userAnswer?.timeMs || 0;

      processedAnswers[question.id] = {
        answer: userAnswer?.answer || '',
        timeMs: userAnswer?.timeMs || 0,
        correct: isCorrect,
      };
    });

    // Create user match result
    await prisma.matchResult.create({
      data: {
        matchId,
        userId,
        score: userScore,
        correctAnswers: userCorrect,
        totalTimeMs: userTotalTime,
        answers: processedAnswers as any,
      },
    });

    // Determine winner
    let winnerId: string | null = null;
    let isDraw = false;

    if (userCorrect > cpuResult.correctAnswers) {
      winnerId = userId;
    } else if (userCorrect < cpuResult.correctAnswers) {
      winnerId = this.CPU_ID;
    } else {
      // Tie on accuracy, check time
      if (userTotalTime < cpuResult.totalTimeMs) {
        winnerId = userId;
      } else if (userTotalTime > cpuResult.totalTimeMs) {
        winnerId = this.CPU_ID;
      } else {
        isDraw = true;
      }
    }

    // Update match status
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    // Return match completed event
    return {
      matchId,
      winnerId,
      isDraw,
      results: [
        {
          userId,
          correctAnswers: userCorrect,
          totalTimeMs: userTotalTime,
          score: userScore,
        },
        {
          userId: this.CPU_ID,
          correctAnswers: cpuResult.correctAnswers,
          totalTimeMs: cpuResult.totalTimeMs,
          score: cpuResult.score,
        },
      ],
      // No ELO changes for CPU matches
      eloChanges: [],
      divisionChanges: [],
      isCPUMatch: true,
    };
  }

  /**
   * Check if a match is a CPU match
   */
  async isCPUMatch(matchId: string): Promise<boolean> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { isCPUMatch: true },
    });

    return match?.isCPUMatch || false;
  }
}

export const cpuOpponentService = new CPUOpponentService();
