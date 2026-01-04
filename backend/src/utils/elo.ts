/**
 * ELO Rating System
 *
 * The ELO rating system is used to calculate player skill ratings
 * based on match outcomes.
 */

interface EloResult {
  newRating: number;
  change: number;
}

/**
 * K-factor determines how much ratings change after each game
 * Higher K-factor = more volatile ratings
 */
const K_FACTOR = 32;

/**
 * Calculate expected score for a player
 * @param playerRating - Current rating of the player
 * @param opponentRating - Current rating of the opponent
 * @returns Expected score (probability of winning) between 0 and 1
 */
export function calculateExpectedScore(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating after a match
 * @param currentRating - Current ELO rating
 * @param opponentRating - Opponent's ELO rating
 * @param actualScore - Actual score (1 for win, 0.5 for draw, 0 for loss)
 * @param kFactor - K-factor (optional, defaults to 32)
 * @returns New rating and rating change
 */
export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number,
  kFactor: number = K_FACTOR
): EloResult {
  const expectedScore = calculateExpectedScore(currentRating, opponentRating);
  const change = Math.round(kFactor * (actualScore - expectedScore));
  const newRating = currentRating + change;

  return {
    newRating,
    change,
  };
}

/**
 * Calculate rating change for multiple players in a match
 * @param players - Array of players with their ratings and scores
 * @returns Array of rating changes for each player
 */
export function calculateMultiPlayerRatings(
  players: Array<{ id: string; rating: number; score: number }>
): Array<{ id: string; newRating: number; change: number }> {
  const results: Array<{ id: string; newRating: number; change: number }> = [];

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // For each player, calculate their new rating based on all opponents
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    let totalChange = 0;
    let newRating = player.rating;

    // Compare against each opponent
    for (let j = 0; j < players.length; j++) {
      if (i === j) continue;

      const opponent = players[j];

      // Determine actual score (1 for win, 0.5 for tie, 0 for loss)
      let actualScore: number;
      if (player.score > opponent.score) {
        actualScore = 1;
      } else if (player.score === opponent.score) {
        actualScore = 0.5;
      } else {
        actualScore = 0;
      }

      // Calculate rating change for this matchup
      const result = calculateNewRating(
        player.rating,
        opponent.rating,
        actualScore,
        K_FACTOR / (players.length - 1) // Distribute K-factor across opponents
      );

      totalChange += result.change;
    }

    newRating = player.rating + totalChange;

    results.push({
      id: player.id,
      newRating,
      change: totalChange,
    });
  }

  return results;
}

/**
 * Find the ELO range for matchmaking
 * @param rating - Player's current rating
 * @param searchRange - Search range multiplier (1 = tight, 2 = medium, 3 = wide)
 * @returns Min and max rating for matching
 */
export function getMatchmakingRange(
  rating: number,
  searchRange: number = 1
): { min: number; max: number } {
  // Base range increases with rating to account for fewer high-rated players
  const baseRange = Math.max(100, Math.floor(rating / 10));
  const range = baseRange * searchRange;

  return {
    min: Math.max(0, rating - range),
    max: rating + range,
  };
}

/**
 * Calculate compatibility score between two players for matchmaking
 * Lower score = better match
 * @param player1Rating - First player's rating
 * @param player2Rating - Second player's rating
 * @returns Compatibility score
 */
export function calculateMatchmakingScore(
  player1Rating: number,
  player2Rating: number
): number {
  return Math.abs(player1Rating - player2Rating);
}
