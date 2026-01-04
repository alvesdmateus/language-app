import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { matchmakingService } from '../services/matchmakingService';
import { gameService } from '../services/gameService';
import { calculateMultiPlayerRatings } from '../utils/elo';
import { updateUserElo } from '../services/userService';
import { getDivisionFromElo } from '../utils/division';
import { socketService } from '../services/socketService';
import { Language, QuestionDifficulty, MatchType } from '@prisma/client';

/**
 * Join matchmaking lobby and find a match
 */
export const findMatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, language, customSettings, isBattleMode, isAsync } = req.body;

    console.log(`[MATCHMAKING] User ${req.userId} requesting match:`, {
      type,
      language,
      isBattleMode,
      isAsync,
    });

    if (!['RANKED', 'CASUAL', 'CUSTOM', 'BATTLE'].includes(type)) {
      throw new AppError('Invalid match type', 400);
    }

    if (!language) {
      throw new AppError('Language is required', 400);
    }

    // Validate custom settings if provided
    if (type === 'CUSTOM' && customSettings) {
      if (![30, 45, 60].includes(customSettings.questionDuration)) {
        throw new AppError('Question duration must be 30, 45, or 60 seconds', 400);
      }
      if (!['EASY', 'MEDIUM', 'HARD'].includes(customSettings.difficulty)) {
        throw new AppError('Invalid difficulty level', 400);
      }
    }

    // Join the matchmaking lobby
    await matchmakingService.joinLobby(req.userId!, type as MatchType, language as Language, {
      customSettings,
      isBattleMode: isBattleMode || type === 'BATTLE',
      isAsync: isAsync || false,
    });

    console.log(`[MATCHMAKING] User ${req.userId} joined lobby, searching for opponent...`);

    // Try to find an opponent
    const opponentId = await matchmakingService.findMatch(req.userId!, type as MatchType);

    if (opponentId) {
      console.log(`[MATCHMAKING] Match found! User ${req.userId} vs ${opponentId}`);

      // Create match with the found opponent
      const matchId = await matchmakingService.createMatch(
        req.userId!,
        opponentId,
        type as MatchType
      );

      console.log(`[MATCHMAKING] Match created with ID: ${matchId}`);

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
      console.log(`[MATCHMAKING] No opponent found for user ${req.userId}, waiting in lobby`);

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
    console.error(`[MATCHMAKING] Error for user ${req.userId}:`, error);
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
 * Submit match result with ELO calculation and winner determination
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

    // Process answers and calculate score
    const processedResult = await gameService.processAnswers(
      matchId,
      req.userId!,
      answers
    );

    // Create result
    const result = await prisma.matchResult.create({
      data: {
        matchId,
        userId: req.userId!,
        score: processedResult.score,
        correctAnswers: processedResult.correctAnswers,
        totalTimeMs: processedResult.totalTimeMs,
        answers: processedResult.processedAnswers as any,
      },
    });

    // Check if all players have submitted
    const allResults = await prisma.matchResult.findMany({
      where: { matchId },
      include: { user: true },
    });

    if (allResults.length >= match.participants.length) {
      // Determine winner
      const winnerData = gameService.determineWinner(
        allResults.map((r) => ({
          userId: r.userId,
          answers: r.answers as any,
          correctAnswers: r.correctAnswers,
          totalTimeMs: r.totalTimeMs,
        }))
      );

      // Mark match as completed
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      // Clean up match tracking
      matchmakingService.cleanupMatch(matchId);

      // Calculate ELO changes for ranked and battle mode matches
      if (match.type === 'RANKED' || match.type === 'BATTLE') {
        // Get language-specific ELO ratings
        const playerStats = await Promise.all(
          match.participants.map((p) =>
            gameService.getOrCreateLanguageStats(p.id, match.language)
          )
        );

        // Use actual game outcome (winner/loser/draw) for ELO calculation
        // Assign effective scores: winner=100, loser=0, draw=50 for both
        const players = allResults.map((r) => {
          let effectiveScore: number;
          if (winnerData.isDraw) {
            effectiveScore = 50; // Draw
          } else if (r.userId === winnerData.winnerId) {
            effectiveScore = 100; // Winner
          } else {
            effectiveScore = 0; // Loser
          }

          return {
            id: r.userId,
            rating: playerStats.find((s) => s.userId === r.userId)?.eloRating || 1000,
            score: effectiveScore,
          };
        });

        const eloResults = calculateMultiPlayerRatings(players);

        // Update language stats and match results with ELO changes
        const divisionChanges: Array<{
          userId: string;
          oldDivision: string;
          newDivision: string;
        }> = [];

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

          // Determine win/loss/draw
          let matchResult: 'win' | 'loss' | 'draw';
          if (winnerData.isDraw) {
            matchResult = 'draw';
          } else if (winnerData.winnerId === eloResult.id) {
            matchResult = 'win';
          } else {
            matchResult = 'loss';
          }

          // Update language-specific stats
          const updateResult = await gameService.updateLanguageStats(
            eloResult.id,
            match.language,
            eloResult.change,
            matchResult
          );

          // Track division changes for notifications
          if (updateResult.divisionChanged) {
            divisionChanges.push({
              userId: eloResult.id,
              oldDivision: updateResult.oldDivision,
              newDivision: updateResult.newDivision,
            });
          }
        }

        // Emit match completed event to both players
        socketService.emitToUsers(
          match.participants.map((p) => p.id),
          'match:completed',
          {
            matchId,
            winnerId: winnerData.winnerId,
            isDraw: winnerData.isDraw,
            results: winnerData.results,
            eloChanges: eloResults,
            divisionChanges,
          }
        );
      } else {
        // Casual/Custom matches - no ELO changes
        socketService.emitToUsers(
          match.participants.map((p) => p.id),
          'match:completed',
          {
            matchId,
            winnerId: winnerData.winnerId,
            isDraw: winnerData.isDraw,
            results: winnerData.results,
          }
        );
      }
    }

    res.json({
      status: 'success',
      data: { result, score: processedResult.score },
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
