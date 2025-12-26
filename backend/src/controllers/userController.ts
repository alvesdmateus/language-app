import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        eloRating: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { eloRating: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        eloRating: true,
        totalPoints: true
      }
    });

    res.json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};
