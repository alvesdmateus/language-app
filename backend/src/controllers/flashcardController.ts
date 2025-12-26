import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const getFlashcards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { count = '10', difficulty, type } = req.query;

    const where: any = {};

    if (difficulty) {
      where.difficulty = parseInt(difficulty as string);
    }

    if (type) {
      where.type = type as string;
    }

    // Get random questions for flashcard review
    const questions = await prisma.question.findMany({
      where,
      take: parseInt(count as string),
      orderBy: { createdAt: 'desc' }
    });

    // Shuffle the questions for variety
    const shuffled = questions.sort(() => Math.random() - 0.5);

    res.json({
      status: 'success',
      data: {
        flashcards: shuffled.map(q => ({
          id: q.id,
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: q.options,
          type: q.type,
          difficulty: q.difficulty,
          explanation: q.explanation
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFlashcardCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get available question types and difficulties
    const questions = await prisma.question.findMany({
      select: {
        type: true,
        difficulty: true
      }
    });

    const types = [...new Set(questions.map(q => q.type))];
    const difficulties = [...new Set(questions.map(q => q.difficulty))].sort();

    res.json({
      status: 'success',
      data: {
        types,
        difficulties,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    next(error);
  }
};
