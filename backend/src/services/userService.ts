import prisma from '../utils/db';
import { getDivisionFromElo, Division } from '../utils/division';

/**
 * Update user's ELO rating and division
 */
export async function updateUserElo(
  userId: string,
  eloChange: number
): Promise<{ newElo: number; newDivision: Division; divisionChanged: boolean }> {
  // Get current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { eloRating: true, division: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const newElo = user.eloRating + eloChange;
  const divisionInfo = getDivisionFromElo(newElo);
  const divisionChanged = user.division !== divisionInfo.division;

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      eloRating: newElo,
      division: divisionInfo.division,
    },
  });

  return {
    newElo,
    newDivision: divisionInfo.division,
    divisionChanged,
  };
}

/**
 * Recalculate and update division for all users
 * Useful for migration or fixing inconsistencies
 */
export async function recalculateAllDivisions(): Promise<number> {
  const users = await prisma.user.findMany({
    select: { id: true, eloRating: true },
  });

  let updated = 0;

  for (const user of users) {
    const divisionInfo = getDivisionFromElo(user.eloRating);

    await prisma.user.update({
      where: { id: user.id },
      data: { division: divisionInfo.division },
    });

    updated++;
  }

  return updated;
}

/**
 * Get user statistics with division info
 */
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      eloRating: true,
      division: true,
      totalPoints: true,
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      createdAt: true,
      _count: {
        select: {
          dailyQuizzes: true,
          matchResults: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get highest language ELO as the user's overall ELO
  const languageStats = await prisma.languageStats.findMany({
    where: { userId },
    select: { eloRating: true, language: true },
    orderBy: { eloRating: 'desc' },
    take: 1,
  });

  // Use highest language ELO, or default user ELO if no language stats exist
  const actualElo = languageStats.length > 0 ? languageStats[0].eloRating : user.eloRating;
  const divisionInfo = getDivisionFromElo(actualElo);

  // Get win/loss record for ranked matches
  const matchResults = await prisma.matchResult.findMany({
    where: {
      userId,
      match: {
        type: 'RANKED',
        status: 'COMPLETED',
      },
    },
    include: {
      match: {
        include: {
          results: true,
        },
      },
    },
  });

  let wins = 0;
  let losses = 0;

  for (const result of matchResults) {
    const allResults = result.match.results;
    const sortedResults = allResults.sort((a, b) => b.score - a.score);
    if (sortedResults[0]?.userId === userId) {
      wins++;
    } else {
      losses++;
    }
  }

  return {
    user: {
      ...user,
      eloRating: actualElo, // Override with highest language ELO
      division: divisionInfo.division, // Override with calculated division
      divisionInfo,
    },
    stats: {
      totalQuizzes: user._count.dailyQuizzes,
      totalMatches: user._count.matchResults,
      wins,
      losses,
      winRate: user._count.matchResults > 0 ? (wins / user._count.matchResults) * 100 : 0,
    },
  };
}
