import prisma from '../utils/db';
import { getMatchmakingRange, calculateMatchmakingScore } from '../utils/elo';
import { socketService } from './socketService';
import { gameService } from './gameService';
import { Language, QuestionDifficulty, MatchType, PowerUpType } from '@prisma/client';
import { powerUpService } from './powerUpService';

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
  isAsync?: boolean;  // Async battle mode
  equippedPowerUp?: PowerUpType;  // Power-up equipped before match
}

interface ActiveMatch {
  matchId: string;
  playerIds: string[];
  createdAt: Date;
}

/**
 * In-memory lobby system for active matchmaking
 * In production, this should be moved to Redis or similar
 */
class MatchmakingService {
  private lobbies: Map<string, LobbyPlayer> = new Map();
  private activeMatches: Map<string, ActiveMatch> = new Map(); // matchId -> match info
  private playerToMatch: Map<string, string> = new Map(); // userId -> matchId
  private readonly MATCH_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_ELO_DIFFERENCE = 200; // Maximum ELO difference for a match
  private readonly READY_CHECK_DURATION = 5000; // 5 seconds to verify connection
  private readonly RECONNECT_TIMEOUT = 30000; // 30 seconds to reconnect

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
      isAsync?: boolean;
      equippedPowerUp?: PowerUpType;
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
      isAsync: options?.isAsync,
      equippedPowerUp: options?.equippedPowerUp || PowerUpType.NONE,
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
    socketService.emitToMatchmaking(matchType as any, 'matchmaking:lobby_update', {
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
      socketService.emitToMatchmaking(player.matchType as any, 'matchmaking:lobby_update', {
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

      // For async mode, must both be async or both sync
      if (player.isAsync !== candidate.isAsync) continue;

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
    const isAsync = player1.isAsync || false;
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

    // Initialize player connections
    const now = new Date().toISOString();
    const playerConnections = {
      [player1Id]: {
        connected: true,
        lastSeen: now,
        disconnectedAt: null,
      },
      [player2Id]: {
        connected: true,
        lastSeen: now,
        disconnectedAt: null,
      },
    };

    // For async matches, start immediately and set turn deadline
    // For sync matches, use ready check
    const matchStatus = isAsync ? 'IN_PROGRESS' : 'READY_CHECK';
    const turnDeadlineAt = isAsync ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours from now

    // Initialize power-up state if power-ups are enabled
    const powerUpsEnabled = player1.customSettings?.powerUpsEnabled || false;
    let powerUpState = undefined;

    if (powerUpsEnabled) {
      const equippedPowerUps = new Map<string, PowerUpType>();
      equippedPowerUps.set(player1Id, player1.equippedPowerUp || PowerUpType.NONE);
      equippedPowerUps.set(player2Id, player2.equippedPowerUp || PowerUpType.NONE);

      powerUpState = powerUpService.initializePowerUpState([player1Id, player2Id], equippedPowerUps);
    }

    // Create match in database
    const match = await prisma.match.create({
      data: {
        type: matchType,
        status: matchStatus,
        language,
        readyCheckStartedAt: isAsync ? null : new Date(),
        startedAt: isAsync ? new Date() : null,
        isBattleMode,
        isAsync,
        currentTurnUserId: isAsync ? player1Id : null,  // Player 1 starts in async mode
        turnDeadlineAt,
        turnDurationHours: 24,
        questionDuration,
        difficulty: player1.customSettings?.difficulty,
        powerUpsEnabled,
        powerUpState: powerUpState as any,
        playerConnections,
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
      isAsync: match.isAsync,
      currentTurnUserId: match.currentTurnUserId,
      turnDeadlineAt: match.turnDeadlineAt,
      turnDurationHours: match.turnDurationHours,
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

    console.log(`[MATCHMAKING] Emitting match_found event to players:`, {
      player1Id,
      player2Id,
      matchId: match.id,
      player1Connected: socketService.isUserConnected(player1Id),
      player2Connected: socketService.isUserConnected(player2Id),
    });

    socketService.emitToUsers([player1Id, player2Id], 'matchmaking:match_found', matchData);

    // Track active match for reconnection
    this.activeMatches.set(match.id, {
      matchId: match.id,
      playerIds: [player1Id, player2Id],
      createdAt: new Date(),
    });
    this.playerToMatch.set(player1Id, match.id);
    this.playerToMatch.set(player2Id, match.id);

    // Update lobby status for remaining players
    if (player1?.matchType) {
      socketService.emitToMatchmaking(player1.matchType as any, 'matchmaking:lobby_update', {
        lobbyStatus: this.getLobbyStatus(),
      });
    }

    // Start ready check process (only for synchronous matches)
    if (!isAsync) {
      this.startReadyCheck(match.id, [player1Id, player2Id]);
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

  /**
   * Start ready check process
   * Waits 5 seconds to verify both players are still connected
   */
  private async startReadyCheck(matchId: string, playerIds: string[]): Promise<void> {
    // Wait for READY_CHECK_DURATION
    await new Promise((resolve) => setTimeout(resolve, this.READY_CHECK_DURATION));

    try {
      // Get current match state
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match || match.status !== 'READY_CHECK') {
        // Match was cancelled or already started
        return;
      }

      // Check if both players are still connected
      const connections = match.playerConnections as any;
      const allConnected = playerIds.every((playerId) => connections[playerId]?.connected);

      if (allConnected) {
        // Both players ready, start the match
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          },
        });

        // Emit match started event
        socketService.emitToUsers(playerIds, 'match:started', {
          matchId,
          message: 'Both players connected. Match is starting!',
        });
      } else {
        // One or both players disconnected during ready check
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: 'CANCELLED',
          },
        });

        // Clean up tracking
        this.activeMatches.delete(matchId);
        playerIds.forEach((id) => this.playerToMatch.delete(id));

        // Find which player(s) disconnected
        const disconnectedPlayers = playerIds.filter(
          (playerId) => !connections[playerId]?.connected
        );
        const connectedPlayers = playerIds.filter(
          (playerId) => connections[playerId]?.connected
        );

        // Notify players
        if (connectedPlayers.length > 0) {
          socketService.emitToUsers(connectedPlayers, 'match:cancelled', {
            reason: 'Opponent failed to connect',
            canRequeue: true,
          });
        }

        // Return disconnected players to lobby if they reconnect
        disconnectedPlayers.forEach((playerId) => {
          socketService.emitToUser(playerId, 'match:cancelled', {
            reason: 'Connection lost during ready check',
            canRequeue: true,
          });
        });
      }
    } catch (error) {
      console.error('Error in ready check:', error);
    }
  }

  /**
   * Handle player disconnect during match
   */
  async handlePlayerDisconnect(userId: string): Promise<void> {
    const matchId = this.playerToMatch.get(userId);
    if (!matchId) return;

    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match || (match.status !== 'READY_CHECK' && match.status !== 'IN_PROGRESS')) {
        return;
      }

      const connections = (match.playerConnections as any) || {};
      const now = new Date().toISOString();

      // Update connection status
      connections[userId] = {
        connected: false,
        lastSeen: now,
        disconnectedAt: now,
      };

      await prisma.match.update({
        where: { id: matchId },
        data: {
          playerConnections: connections,
        },
      });

      // Get other player(s)
      const activeMatch = this.activeMatches.get(matchId);
      if (activeMatch) {
        const otherPlayers = activeMatch.playerIds.filter((id) => id !== userId);

        // Notify other players of disconnect
        socketService.emitToUsers(otherPlayers, 'match:opponent_disconnected', {
          message: 'Opponent disconnected. They have 30 seconds to reconnect.',
          disconnectedUserId: userId,
        });
      }

      // Start reconnect timeout
      this.startReconnectTimeout(matchId, userId);
    } catch (error) {
      console.error('Error handling player disconnect:', error);
    }
  }

  /**
   * Handle player reconnect
   */
  async handlePlayerReconnect(userId: string): Promise<void> {
    const matchId = this.playerToMatch.get(userId);
    if (!matchId) return;

    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          participants: true,
          results: true,
        },
      });

      if (!match) return;

      const connections = (match.playerConnections as any) || {};
      const now = new Date().toISOString();

      // Check if player was disconnected
      if (connections[userId] && !connections[userId].connected) {
        // Update connection status
        connections[userId] = {
          connected: true,
          lastSeen: now,
          disconnectedAt: null,
        };

        await prisma.match.update({
          where: { id: matchId },
          data: {
            playerConnections: connections,
          },
        });

        // Get other player(s)
        const activeMatch = this.activeMatches.get(matchId);
        if (activeMatch) {
          const otherPlayers = activeMatch.playerIds.filter((id) => id !== userId);

          // Notify other players of reconnect
          socketService.emitToUsers(otherPlayers, 'match:opponent_reconnected', {
            message: 'Opponent reconnected!',
            reconnectedUserId: userId,
          });
        }

        // Send current match state to reconnected player
        socketService.emitToUser(userId, 'match:reconnected', {
          matchId: match.id,
          match: {
            id: match.id,
            type: match.type,
            status: match.status,
            language: match.language,
            questions: match.questions,
            questionDuration: match.questionDuration,
            difficulty: match.difficulty,
            powerUpsEnabled: match.powerUpsEnabled,
            isBattleMode: match.isBattleMode,
            startedAt: match.startedAt,
            participants: match.participants,
            results: match.results,
          },
          message: 'Reconnected successfully! Continue playing.',
        });
      }
    } catch (error) {
      console.error('Error handling player reconnect:', error);
    }
  }

  /**
   * Start reconnect timeout for a disconnected player
   */
  private async startReconnectTimeout(matchId: string, userId: string): Promise<void> {
    // Wait for RECONNECT_TIMEOUT
    await new Promise((resolve) => setTimeout(resolve, this.RECONNECT_TIMEOUT));

    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match || match.status === 'COMPLETED' || match.status === 'CANCELLED') {
        return;
      }

      const connections = (match.playerConnections as any) || {};

      // Check if player is still disconnected
      if (connections[userId] && !connections[userId].connected) {
        // Player failed to reconnect - forfeit match
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: 'CANCELLED',
          },
        });

        // Get other player(s)
        const activeMatch = this.activeMatches.get(matchId);
        if (activeMatch) {
          const otherPlayers = activeMatch.playerIds.filter((id) => id !== userId);

          // Notify other players
          socketService.emitToUsers(otherPlayers, 'match:opponent_forfeited', {
            message: 'Opponent failed to reconnect. You win by forfeit!',
            forfeitedUserId: userId,
          });

          // Notify disconnected player
          socketService.emitToUser(userId, 'match:forfeited', {
            message: 'Failed to reconnect in time. Match forfeited.',
          });
        }

        // Clean up
        this.cleanupMatch(matchId);
      }
    } catch (error) {
      console.error('Error in reconnect timeout:', error);
    }
  }

  /**
   * Get the match ID for a player
   */
  getPlayerMatch(userId: string): string | undefined {
    return this.playerToMatch.get(userId);
  }

  /**
   * Clean up match tracking when match is completed
   */
  cleanupMatch(matchId: string): void {
    const activeMatch = this.activeMatches.get(matchId);
    if (activeMatch) {
      activeMatch.playerIds.forEach((playerId) => {
        this.playerToMatch.delete(playerId);
      });
      this.activeMatches.delete(matchId);
    }
  }

  /**
   * Update player heartbeat to track active connection
   */
  async updatePlayerHeartbeat(userId: string): Promise<void> {
    const matchId = this.playerToMatch.get(userId);
    if (!matchId) return;

    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) return;

      const connections = (match.playerConnections as any) || {};
      const now = new Date().toISOString();

      if (connections[userId]) {
        connections[userId].lastSeen = now;

        await prisma.match.update({
          where: { id: matchId },
          data: {
            playerConnections: connections,
          },
        });
      }
    } catch (error) {
      console.error('Error updating player heartbeat:', error);
    }
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService();
