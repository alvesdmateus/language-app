import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const findMatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.body;

    if (!['RANKED', 'CASUAL'].includes(type)) {
      throw new AppError('Invalid match type', 400);
    }

    const waitingMatch = await prisma.match.findFirst({
      where: {
        type,
        status: 'WAITING',
        participants: {
          none: { id: req.userId }
        }
      },
      include: {
        participants: true
      }
    });

    let match;

    if (waitingMatch && waitingMatch.participants.length < 2) {
      const questions = await prisma.question.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      match = await prisma.match.update({
        where: { id: waitingMatch.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            type: q.type
          })),
          participants: {
            connect: { id: req.userId }
          }
        },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              displayName: true,
              eloRating: true
            }
          }
        }
      });
    } else {
      match = await prisma.match.create({
        data: {
          type,
          status: 'WAITING',
          questions: [],
          participants: {
            connect: { id: req.userId }
          }
        },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              displayName: true,
              eloRating: true
            }
          }
        }
      });
    }

    res.json({
      status: 'success',
      data: { match }
    });
  } catch (error) {
    next(error);
  }
};

export const submitMatchResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { matchId, answers } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true, results: true }
    });

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    const existingResult = await prisma.matchResult.findUnique({
      where: {
        matchId_userId: {
          matchId,
          userId: req.userId!
        }
      }
    });

    if (existingResult) {
      throw new AppError('Result already submitted', 409);
    }

    let score = 0;
    const questionIds = (match.questions as any[]).map(q => q.id);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } }
    });

    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        score += 10;
      }
    });

    const result = await prisma.matchResult.create({
      data: {
        matchId,
        userId: req.userId!,
        score,
        answers
      }
    });

    if (match.results.length + 1 >= match.participants.length) {
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date()
        }
      });

      if (match.type === 'RANKED') {
        const allResults = await prisma.matchResult.findMany({
          where: { matchId },
          include: { user: true }
        });

        allResults.sort((a, b) => b.score - a.score);

        for (let i = 0; i < allResults.length; i++) {
          const eloChange = i === 0 ? 25 : -15;
          await prisma.matchResult.update({
            where: { id: allResults[i].id },
            data: { eloChange }
          });
          await prisma.user.update({
            where: { id: allResults[i].userId },
            data: { eloRating: { increment: eloChange } }
          });
        }
      }
    }

    res.json({
      status: 'success',
      data: { result, score }
    });
  } catch (error) {
    next(error);
  }
};
