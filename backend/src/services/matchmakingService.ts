import prisma from '../utils/db';
import { getMatchmakingRange, calculateMatchmakingScore } from '../utils/elo';
import { socketService } from './socketService';

interface LobbyPlayer {
  userId: string;
  eloRating: number;
  matchType: 'RANKED' | 'CASUAL';
  joinedAt: Date;
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
  async joinLobby(userId: string, matchType: 'RANKED' | 'CASUAL'): Promise<void> {
    // Get player's current ELO
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { eloRating: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove player from lobby if already in one
    this.leaveLobby(userId);

    // Add to lobby
    this.lobbies.set(userId, {
      userId,
      eloRating: user.eloRating,
      matchType,
      joinedAt: new Date(),
    });

    // Clean up old lobbies
    this.cleanupOldLobbies();

    // Emit event to user
    socketService.emitToUser(userId, 'matchmaking:joined', {
      matchType,
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
    matchType: 'RANKED' | 'CASUAL'
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

      // Check if within ELO range
      if (candidate.eloRating < range.min || candidate.eloRating > range.max) {
        continue;
      }

      // Calculate compatibility score
      const score = calculateMatchmakingScore(player.eloRating, candidate.eloRating);

      // For ranked, enforce maximum ELO difference
      if (matchType === 'RANKED' && score > this.MAX_ELO_DIFFERENCE * searchRangeMultiplier) {
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
   * Create a match between two players
   */
  async createMatch(
    player1Id: string,
    player2Id: string,
    matchType: 'RANKED' | 'CASUAL'
  ): Promise<string> {
    // Remove both players from lobby (without emitting leave events)
    const player1 = this.lobbies.get(player1Id);
    const player2 = this.lobbies.get(player2Id);
    this.lobbies.delete(player1Id);
    this.lobbies.delete(player2Id);

    // Get random questions
    const questions = await this.getRandomQuestions(10);

    // Create match in database
    const match = await prisma.match.create({
      data: {
        type: matchType,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          type: q.type,
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

    // Emit match found event to both players
    const matchData = {
      matchId: match.id,
      matchType: match.type,
      status: match.status,
      questions: match.questions,
      participants: match.participants,
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
   * Get random questions for a match
   */
  private async getRandomQuestions(count: number) {
    // Get total question count
    const totalQuestions = await prisma.question.count();

    if (totalQuestions === 0) {
      throw new Error('No questions available');
    }

    // Generate random offsets
    const randomOffsets = new Set<number>();
    while (randomOffsets.size < Math.min(count, totalQuestions)) {
      randomOffsets.add(Math.floor(Math.random() * totalQuestions));
    }

    // Fetch questions at random positions
    const questions = await Promise.all(
      Array.from(randomOffsets).map((offset) =>
        prisma.question.findMany({
          take: 1,
          skip: offset,
        })
      )
    );

    return questions.flat();
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
