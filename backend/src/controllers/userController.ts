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

export const updateFavoriteLanguage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language } = req.body;

    if (!language) {
      throw new AppError('Language is required', 400);
    }

    const validLanguages = ['PORTUGUESE', 'SPANISH', 'ENGLISH', 'ITALIAN', 'FRENCH', 'GERMAN', 'JAPANESE', 'KOREAN'];
    if (!validLanguages.includes(language)) {
      throw new AppError('Invalid language', 400);
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { favoriteLanguage: language },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        favoriteLanguage: true,
        onboardingCompleted: true,
        tutorialStep: true,
      },
    });

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const completeOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        onboardingCompleted: true,
        tutorialStep: 100, // Mark as fully completed
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        favoriteLanguage: true,
        onboardingCompleted: true,
        tutorialStep: true,
      },
    });

    res.json({
      status: 'success',
      data: { user },
      message: 'Onboarding completed successfully!',
    });
  } catch (error) {
    next(error);
  }
};
