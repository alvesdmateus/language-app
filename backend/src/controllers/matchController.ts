import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { matchmakingService } from '../services/matchmakingService';
import { calculateMultiPlayerRatings } from '../utils/elo';
import { updateUserElo } from '../services/userService';
import { getDivisionFromElo } from '../utils/division';

/**
 * Join matchmaking lobby and find a match
 */
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

    // Join the matchmaking lobby
    await matchmakingService.joinLobby(req.userId!, type);

    // Try to find an opponent
    const opponentId = await matchmakingService.findMatch(req.userId!, type);

    if (opponentId) {
      // Create match with the found opponent
      const matchId = await matchmakingService.createMatch(
        req.userId!,
        opponentId,
        type
      );

      // Fetch the created match
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              displayName: true,
              eloRating: true,
            },
          },
        },
      });

      res.json({
        status: 'success',
        data: {
          match,
          matched: true,
        },
      });
    } else {
      // No opponent found yet, player is in lobby waiting
      res.json({
        status: 'success',
        data: {
          matched: false,
          message: 'Searching for opponent...',
          lobbyStatus: matchmakingService.getLobbyStatus(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Leave matchmaking lobby
 */
export const leaveLobby = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    matchmakingService.leaveLobby(req.userId!);

    res.json({
      status: 'success',
      data: { message: 'Left matchmaking lobby' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check matchmaking status
 */
export const checkMatchStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.query;

    if (!type || !['RANKED', 'CASUAL'].includes(type as string)) {
      throw new AppError('Invalid match type', 400);
    }

    const isInLobby = matchmakingService.isInLobby(req.userId!);

    if (!isInLobby) {
      return res.json({
        status: 'success',
        data: {
          inLobby: false,
          matched: false,
        },
      });
    }

    // Try to find a match
    const opponentId = await matchmakingService.findMatch(
      req.userId!,
      type as 'RANKED' | 'CASUAL'
    );

    if (opponentId) {
      // Create match with the found opponent
      const matchId = await matchmakingService.createMatch(
        req.userId!,
        opponentId,
        type as 'RANKED' | 'CASUAL'
      );

      // Fetch the created match
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              displayName: true,
              eloRating: true,
            },
          },
        },
      });

      res.json({
        status: 'success',
        data: {
          inLobby: false,
          matched: true,
          match,
        },
      });
    } else {
      res.json({
        status: 'success',
        data: {
          inLobby: true,
          matched: false,
          lobbyStatus: matchmakingService.getLobbyStatus(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Submit match result with ELO calculation
 */
export const submitMatchResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { matchId, answers } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true, results: true },
    });

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    // Check if user is a participant
    const isParticipant = match.participants.some((p) => p.id === req.userId);
    if (!isParticipant) {
      throw new AppError('You are not a participant in this match', 403);
    }

    const existingResult = await prisma.matchResult.findUnique({
      where: {
        matchId_userId: {
          matchId,
          userId: req.userId!,
        },
      },
    });

    if (existingResult) {
      throw new AppError('Result already submitted', 409);
    }

    // Calculate score
    let score = 0;
    const questionIds = (match.questions as any[]).map((q) => q.id);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        score += 10;
      }
    });

    // Create result
    const result = await prisma.matchResult.create({
      data: {
        matchId,
        userId: req.userId!,
        score,
        answers,
      },
    });

    // Check if all players have submitted
    const allResults = await prisma.matchResult.findMany({
      where: { matchId },
      include: { user: true },
    });

    if (allResults.length >= match.participants.length) {
      // Mark match as completed
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      // Calculate ELO changes for ranked matches
      if (match.type === 'RANKED') {
        const players = allResults.map((r) => ({
          id: r.userId,
          rating: r.user.eloRating,
          score: r.score,
        }));

        const eloResults = calculateMultiPlayerRatings(players);

        // Update ELO ratings, divisions, and match results
        const divisionChanges: Array<{ userId: string; oldDivision: string; newDivision: string }> = [];

        for (const eloResult of eloResults) {
          // Update match result with ELO change
          await prisma.matchResult.update({
            where: {
              matchId_userId: {
                matchId,
                userId: eloResult.id,
              },
            },
            data: { eloChange: eloResult.change },
          });

          // Update user ELO and division
          const updateResult = await updateUserElo(eloResult.id, eloResult.change);

          // Track division changes for notifications
          if (updateResult.divisionChanged) {
            const user = await prisma.user.findUnique({
              where: { id: eloResult.id },
              select: { division: true },
            });
            if (user) {
              divisionChanges.push({
                userId: eloResult.id,
                oldDivision: user.division,
                newDivision: updateResult.newDivision,
              });
            }
          }
        }
      }
    }

    res.json({
      status: 'success',
      data: { result, score },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get match details
 */
export const getMatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            displayName: true,
            eloRating: true,
          },
        },
        results: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    // Check if user is a participant
    const isParticipant = match.participants.some((p) => p.id === req.userId);
    if (!isParticipant) {
      throw new AppError('You are not a participant in this match', 403);
    }

    res.json({
      status: 'success',
      data: { match },
    });
  } catch (error) {
    next(error);
  }
};
