import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { gameService } from '../services/gameService';
import { Language } from '@prisma/client';
import { getDivisionFromElo } from '../utils/division';

/**
 * Get user's language stats for all languages
 */
export const getAllLanguageStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await prisma.languageStats.findMany({
      where: { userId: req.userId! },
      orderBy: { eloRating: 'desc' },
    });

    // If no stats exist, create default stats for all languages
    if (stats.length === 0) {
      const allLanguages: Language[] = [
        Language.PORTUGUESE,
        Language.SPANISH,
        Language.ENGLISH,
        Language.ITALIAN,
        Language.FRENCH,
        Language.GERMAN,
        Language.JAPANESE,
        Language.KOREAN,
      ];

      const createdStats = await Promise.all(
        allLanguages.map((language) =>
          gameService.getOrCreateLanguageStats(req.userId!, language)
        )
      );

      // Add division info to all created stats
      const statsWithDivisionInfo = createdStats.map((stat) => {
        const divisionInfo = getDivisionFromElo(stat.eloRating);
        return {
          ...stat,
          divisionInfo,
        };
      });

      res.json({
        status: 'success',
        data: { stats: statsWithDivisionInfo },
      });
      return;
    }

    // Add division info to all stats (calculated from current ELO)
    const statsWithDivisionInfo = stats.map((stat) => {
      const divisionInfo = getDivisionFromElo(stat.eloRating);
      return {
        ...stat,
        divisionInfo,
      };
    });

    res.json({
      status: 'success',
      data: { stats: statsWithDivisionInfo },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's language stats for a specific language
 */
export const getLanguageStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language } = req.params;

    if (!Object.values(Language).includes(language as Language)) {
      throw new AppError('Invalid language', 400);
    }

    const stats = await gameService.getOrCreateLanguageStats(
      req.userId!,
      language as Language
    );

    const divisionInfo = getDivisionFromElo(stats.eloRating);

    res.json({
      status: 'success',
      data: {
        stats: {
          ...stats,
          divisionInfo,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leaderboard for a specific language
 */
export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    if (!Object.values(Language).includes(language as Language)) {
      throw new AppError('Invalid language', 400);
    }

    const stats = await prisma.languageStats.findMany({
      where: { language: language as Language },
      orderBy: { eloRating: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: { leaderboard: stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's match history for a specific language
 */
export const getMatchHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!Object.values(Language).includes(language as Language)) {
      throw new AppError('Invalid language', 400);
    }

    const matches = await prisma.match.findMany({
      where: {
        language: language as Language,
        participants: {
          some: { id: req.userId! },
        },
        status: 'COMPLETED',
      },
      orderBy: { endedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        results: {
          where: { userId: req.userId! },
          select: {
            score: true,
            correctAnswers: true,
            totalTimeMs: true,
            eloChange: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: { matches },
    });
  } catch (error) {
    next(error);
  }
};
