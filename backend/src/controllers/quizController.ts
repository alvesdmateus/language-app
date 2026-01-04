import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const getDailyQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quiz = await prisma.dailyQuiz.findUnique({
      where: { date: today }
    });

    if (!quiz) {
      const questions = await prisma.question.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      quiz = await prisma.dailyQuiz.create({
        data: {
          date: today,
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            type: q.type
          }))
        }
      });
    }

    const completion = await prisma.dailyQuizCompletion.findUnique({
      where: {
        userId_quizId: {
          userId: req.userId!,
          quizId: quiz.id
        }
      }
    });

    res.json({
      status: 'success',
      data: {
        quiz: {
          id: quiz.id,
          questions: quiz.questions,
          completed: !!completion
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const submitDailyQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId, answers } = req.body;

    const quiz = await prisma.dailyQuiz.findUnique({
      where: { id: quizId }
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const existingCompletion = await prisma.dailyQuizCompletion.findUnique({
      where: {
        userId_quizId: {
          userId: req.userId!,
          quizId: quiz.id
        }
      }
    });

    if (existingCompletion) {
      throw new AppError('Quiz already completed', 409);
    }

    let score = 0;
    const questionIds = (quiz.questions as any[]).map(q => q.id);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } }
    });

    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        score += 10;
      }
    });

    const completion = await prisma.dailyQuizCompletion.create({
      data: {
        userId: req.userId!,
        quizId: quiz.id,
        score,
        answers
      }
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        totalPoints: { increment: score },
        currentStreak: { increment: 1 },
        lastActiveDate: new Date()
      }
    });

    res.json({
      status: 'success',
      data: { completion, score }
    });
  } catch (error) {
    next(error);
  }
};
