import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { getUserStats } from '../services/userService';
import { getDivisionFromElo, getDivisionProgress } from '../utils/division';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = await getUserStats(req.userId!);

    res.json({
      status: 'success',
      data: userData
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
        division: true,
        totalPoints: true
      }
    });

    // Enrich with division info
    const enrichedUsers = users.map((user, index) => {
      const divisionInfo = getDivisionFromElo(user.eloRating);
      return {
        ...user,
        rank: index + 1,
        divisionInfo,
      };
    });

    res.json({
      status: 'success',
      data: { users: enrichedUsers }
    });
  } catch (error) {
    next(error);
  }
};

export const getDivisionLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { division } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!division) {
      throw new AppError('Division parameter required', 400);
    }

    const users = await prisma.user.findMany({
      where: { division: division.toUpperCase() as any },
      take: limit,
      orderBy: { eloRating: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        eloRating: true,
        division: true,
        totalPoints: true
      }
    });

    const enrichedUsers = users.map((user, index) => {
      const divisionInfo = getDivisionFromElo(user.eloRating);
      return {
        ...user,
        rank: index + 1,
        divisionInfo,
      };
    });

    res.json({
      status: 'success',
      data: { users: enrichedUsers, division }
    });
  } catch (error) {
    next(error);
  }
};
