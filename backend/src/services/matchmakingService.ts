import prisma from '../utils/db';
import { getMatchmakingRange, calculateMatchmakingScore } from '../utils/elo';
import { socketService } from './socketService';
import { gameService } from './gameService';
import { Language, QuestionDifficulty, MatchType } from '@prisma/client';

interface LobbyPlayer {
  userId: string;
  eloRating: number;
  matchType: MatchType;
  language: Language;
  joinedAt: Date;
  // Custom lobby settings
  customSettings?: {
    questionDuration: number; // 30, 45, or 60
    difficulty: QuestionDifficulty;
    powerUpsEnabled: boolean;
  };
  isBattleMode?: boolean;
}

/**
 * In-memory lobby system for active matchmaking
 * In production, this should be moved to Redis or similar
 */
class MatchmakingService {
  private lobbies: Map<string, LobbyPlayer> = new Map();
  private readonly MATCH_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_ELO_DIFFERENCE = 200; // Maximum ELO difference for a match

  /**
   * Add a player to the matchmaking lobby
   */
  async joinLobby(
    userId: string,
    matchType: MatchType,
    language: Language,
    options?: {
      customSettings?: {
        questionDuration: number;
        difficulty: QuestionDifficulty;
        powerUpsEnabled: boolean;
      };
      isBattleMode?: boolean;
    }
  ): Promise<void> {
    // Get player's current ELO for this language
    const languageStats = await gameService.getOrCreateLanguageStats(
      userId,
      language
    );

    // Remove player from lobby if already in one
    this.leaveLobby(userId);

    // Add to lobby
    this.lobbies.set(userId, {
      userId,
      eloRating: languageStats.eloRating,
      matchType,
      language,
      joinedAt: new Date(),
      customSettings: options?.customSettings,
      isBattleMode: options?.isBattleMode,
    });

    // Clean up old lobbies
    this.cleanupOldLobbies();

    // Emit event to user
    socketService.emitToUser(userId, 'matchmaking:joined', {
      matchType,
      language,
      lobbyStatus: this.getLobbyStatus(),
    });

    // Emit lobby update to all in this matchmaking type
    socketService.emitToMatchmaking(matchType, 'matchmaking:lobby_update', {
      lobbyStatus: this.getLobbyStatus(),
    });
  }

  /**
   * Remove a player from the matchmaking lobby
   */
  leaveLobby(userId: string): void {
    const player = this.lobbies.get(userId);
    this.lobbies.delete(userId);

    if (player) {
      // Emit event to user
      socketService.emitToUser(userId, 'matchmaking:left', {
        matchType: player.matchType,
      });

      // Emit lobby update to all in this matchmaking type
      socketService.emitToMatchmaking(player.matchType, 'matchmaking:lobby_update', {
        lobbyStatus: this.getLobbyStatus(),
      });
    }
  }

  /**
   * Find a suitable opponent for a player
   * Uses ELO-based matching with expanding search range
   */
  async findMatch(
    userId: string,
    matchType: MatchType
  ): Promise<string | null> {
    const player = this.lobbies.get(userId);
    if (!player) {
      return null;
    }

    // Calculate how long the player has been waiting
    const waitTime = Date.now() - player.joinedAt.getTime();
    const searchRangeMultiplier = Math.min(3, 1 + Math.floor(waitTime / 20000)); // Expand every 20 seconds

    // Get matchmaking range based on ELO and wait time
    const range = getMatchmakingRange(player.eloRating, searchRangeMultiplier);

    // Find potential opponents
    const candidates: Array<{ userId: string; score: number }> = [];

    for (const [candidateId, candidate] of this.lobbies.entries()) {
      // Skip self
      if (candidateId === userId) continue;

      // Must be same match type
      if (candidate.matchType !== matchType) continue;

      // Must be same language
      if (candidate.language !== player.language) continue;

      // For battle mode, must both be battle mode
      if (player.isBattleMode !== candidate.isBattleMode) continue;

      // For custom lobbies, settings must match
      if (matchType === MatchType.CUSTOM) {
        if (!this.customSettingsMatch(player.customSettings, candidate.customSettings)) {
          continue;
        }
      }

      // Check if within ELO range
      if (candidate.eloRating < range.min || candidate.eloRating > range.max) {
        continue;
      }

      // Calculate compatibility score
      const score = calculateMatchmakingScore(player.eloRating, candidate.eloRating);

      // For ranked/battle mode, enforce maximum ELO difference
      if ((matchType === MatchType.RANKED || matchType === MatchType.BATTLE) &&
          score > this.MAX_ELO_DIFFERENCE * searchRangeMultiplier) {
        continue;
      }

      candidates.push({ userId: candidateId, score });
    }

    // No suitable opponents found
    if (candidates.length === 0) {
      return null;
    }

    // Sort by compatibility (lower score = better match)
    candidates.sort((a, b) => a.score - b.score);

    // Return best match
    return candidates[0].userId;
  }

  /**
   * Check if custom settings match between two players
   */
  private customSettingsMatch(
    settings1?: LobbyPlayer['customSettings'],
    settings2?: LobbyPlayer['customSettings']
  ): boolean {
    if (!settings1 || !settings2) return false;

    return (
      settings1.questionDuration === settings2.questionDuration &&
      settings1.difficulty === settings2.difficulty &&
      settings1.powerUpsEnabled === settings2.powerUpsEnabled
    );
  }

  /**
   * Create a match between two players
   */
  async createMatch(
    player1Id: string,
    player2Id: string,
    matchType: MatchType
  ): Promise<string> {
    // Remove both players from lobby (without emitting leave events)
    const player1 = this.lobbies.get(player1Id);
    const player2 = this.lobbies.get(player2Id);
    this.lobbies.delete(player1Id);
    this.lobbies.delete(player2Id);

    if (!player1 || !player2) {
      throw new Error('Players not found in lobby');
    }

    // Determine match configuration
    const isBattleMode = player1.isBattleMode || false;
    const language = player1.language;

    // Use average ELO for question selection in ranked/battle mode
    const averageElo = Math.floor((player1.eloRating + player2.eloRating) / 2);

    // Select questions based on match type
    const questions = await gameService.selectQuestions({
      language,
      difficulty: player1.customSettings?.difficulty,
      eloRating: averageElo,
      count: isBattleMode ? 5 : (player1.customSettings ? 10 : 10),
      isBattleMode,
    });

    // Determine question duration
    let questionDuration: number | null = null;
    if (isBattleMode) {
      questionDuration = 45; // Battle mode: always 45 seconds
    } else if (player1.customSettings) {
      questionDuration = player1.customSettings.questionDuration;
    }

    // Create match in database
    const match = await prisma.match.create({
      data: {
        type: matchType,
        status: 'IN_PROGRESS',
        language,
        startedAt: new Date(),
        isBattleMode,
        questionDuration,
        difficulty: player1.customSettings?.difficulty,
        powerUpsEnabled: player1.customSettings?.powerUpsEnabled || false,
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          type: q.type,
          difficulty: q.difficulty,
        })),
        participants: {
          connect: [{ id: player1Id }, { id: player2Id }],
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

    // Get language-specific stats for participants
    const player1Stats = await gameService.getOrCreateLanguageStats(player1Id, language);
    const player2Stats = await gameService.getOrCreateLanguageStats(player2Id, language);

    // Emit match found event to both players
    const matchData = {
      matchId: match.id,
      matchType: match.type,
      status: match.status,
      language: match.language,
      isBattleMode: match.isBattleMode,
      questionDuration: match.questionDuration,
      difficulty: match.difficulty,
      powerUpsEnabled: match.powerUpsEnabled,
      questions: match.questions,
      participants: match.participants.map((p) => ({
        ...p,
        languageElo: p.id === player1Id ? player1Stats.eloRating : player2Stats.eloRating,
      })),
      startedAt: match.startedAt,
    };

    socketService.emitToUsers([player1Id, player2Id], 'matchmaking:match_found', matchData);

    // Update lobby status for remaining players
    if (player1?.matchType) {
      socketService.emitToMatchmaking(player1.matchType, 'matchmaking:lobby_update', {
        lobbyStatus: this.getLobbyStatus(),
      });
    }

    return match.id;
  }


  /**
   * Remove players who have been waiting too long
   */
  private cleanupOldLobbies(): void {
    const now = Date.now();
    for (const [userId, player] of this.lobbies.entries()) {
      if (now - player.joinedAt.getTime() > this.MATCH_TIMEOUT) {
        this.lobbies.delete(userId);
      }
    }
  }

  /**
   * Get current lobby status (for debugging/monitoring)
   */
  getLobbyStatus(): {
    totalPlayers: number;
    rankedPlayers: number;
    casualPlayers: number;
  } {
    let rankedPlayers = 0;
    let casualPlayers = 0;

    for (const player of this.lobbies.values()) {
      if (player.matchType === 'RANKED') {
        rankedPlayers++;
      } else {
        casualPlayers++;
      }
    }

    return {
      totalPlayers: this.lobbies.size,
      rankedPlayers,
      casualPlayers,
    };
  }

  /**
   * Check if a player is in a lobby
   */
  isInLobby(userId: string): boolean {
    return this.lobbies.has(userId);
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService();
