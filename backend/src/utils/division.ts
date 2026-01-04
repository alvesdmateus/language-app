/**
 * Division/Ranking System
 *
 * Players are assigned divisions based on their ELO rating
 */

export enum Division {
  UNRANKED = 'UNRANKED',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
  GRANDMASTER = 'GRANDMASTER',
}

export interface DivisionInfo {
  division: Division;
  tier: number; // 1-4 (IV, III, II, I)
  minElo: number;
  maxElo: number;
  color: string;
  displayName: string;
}

/**
 * Division tier ranges
 * Each division has 4 tiers (IV, III, II, I)
 */
const DIVISION_RANGES: Record<Division, { min: number; max: number; color: string }> = {
  [Division.UNRANKED]: { min: 0, max: 799, color: '#808080' },
  [Division.BRONZE]: { min: 800, max: 1099, color: '#CD7F32' },
  [Division.SILVER]: { min: 1100, max: 1399, color: '#C0C0C0' },
  [Division.GOLD]: { min: 1400, max: 1699, color: '#FFD700' },
  [Division.PLATINUM]: { min: 1700, max: 1999, color: '#E5E4E2' },
  [Division.DIAMOND]: { min: 2000, max: 2299, color: '#B9F2FF' },
  [Division.MASTER]: { min: 2300, max: 2599, color: '#9B30FF' },
  [Division.GRANDMASTER]: { min: 2600, max: Infinity, color: '#FF1493' },
};

/**
 * Get division information based on ELO rating
 */
export function getDivisionFromElo(elo: number): DivisionInfo {
  // Find the division
  let division = Division.UNRANKED;
  let range = DIVISION_RANGES[Division.UNRANKED];

  for (const [div, divRange] of Object.entries(DIVISION_RANGES)) {
    if (elo >= divRange.min && elo <= divRange.max) {
      division = div as Division;
      range = divRange;
      break;
    }
  }

  // Calculate tier within division (1-4)
  let tier = 1;
  if (division !== Division.UNRANKED && division !== Division.GRANDMASTER) {
    const divisionSpan = range.max - range.min;
    const tierSize = divisionSpan / 4;
    const eloInDivision = elo - range.min;
    tier = 4 - Math.floor(eloInDivision / tierSize);
    tier = Math.max(1, Math.min(4, tier)); // Clamp between 1-4
  }

  return {
    division,
    tier,
    minElo: range.min,
    maxElo: range.max,
    color: range.color,
    displayName: getDivisionDisplayName(division, tier),
  };
}

/**
 * Get formatted division name with tier
 */
export function getDivisionDisplayName(division: Division, tier: number): string {
  if (division === Division.UNRANKED) {
    return 'Unranked';
  }

  if (division === Division.GRANDMASTER || division === Division.MASTER) {
    return division;
  }

  const tierRoman = ['IV', 'III', 'II', 'I'];
  return `${division} ${tierRoman[tier - 1]}`;
}

/**
 * Get all divisions with their ranges
 */
export function getAllDivisions(): Array<{
  division: Division;
  minElo: number;
  maxElo: number;
  color: string;
}> {
  return Object.entries(DIVISION_RANGES).map(([division, range]) => ({
    division: division as Division,
    minElo: range.min,
    maxElo: range.max,
    color: range.color,
  }));
}

/**
 * Get progress to next division
 */
export function getDivisionProgress(elo: number): {
  current: DivisionInfo;
  next: DivisionInfo | null;
  progress: number; // 0-100
  eloToNext: number;
} {
  const current = getDivisionFromElo(elo);

  // Find next division
  const divisions = Object.entries(DIVISION_RANGES).sort((a, b) => a[1].min - b[1].min);
  const currentIndex = divisions.findIndex(([div]) => div === current.division);

  let next: DivisionInfo | null = null;
  let eloToNext = 0;
  let progress = 0;

  if (currentIndex < divisions.length - 1) {
    const [nextDiv, nextRange] = divisions[currentIndex + 1];
    next = {
      division: nextDiv as Division,
      tier: 4,
      minElo: nextRange.min,
      maxElo: nextRange.max,
      color: nextRange.color,
      displayName: getDivisionDisplayName(nextDiv as Division, 4),
    };

    eloToNext = nextRange.min - elo;
    const divisionSpan = current.maxElo - current.minElo;
    const eloInDivision = elo - current.minElo;
    progress = Math.round((eloInDivision / divisionSpan) * 100);
  } else {
    // Already at highest division
    progress = 100;
  }

  return {
    current,
    next,
    progress: Math.max(0, Math.min(100, progress)),
    eloToNext: Math.max(0, eloToNext),
  };
}

/**
 * Get division rank suffix (for display purposes)
 */
export function getDivisionRank(division: Division): number {
  const ranks: Record<Division, number> = {
    [Division.UNRANKED]: 0,
    [Division.BRONZE]: 1,
    [Division.SILVER]: 2,
    [Division.GOLD]: 3,
    [Division.PLATINUM]: 4,
    [Division.DIAMOND]: 5,
    [Division.MASTER]: 6,
    [Division.GRANDMASTER]: 7,
  };
  return ranks[division];
}

/**
 * Check if a player is eligible for ranked play
 */
export function isEligibleForRanked(elo: number): boolean {
  return elo >= DIVISION_RANGES[Division.BRONZE].min;
}

/**
 * Get division emoji/icon
 */
export function getDivisionEmoji(division: Division): string {
  const emojis: Record<Division, string> = {
    [Division.UNRANKED]: '⚪',
    [Division.BRONZE]: '🥉',
    [Division.SILVER]: '🥈',
    [Division.GOLD]: '🥇',
    [Division.PLATINUM]: '💎',
    [Division.DIAMOND]: '💠',
    [Division.MASTER]: '👑',
    [Division.GRANDMASTER]: '🏆',
  };
  return emojis[division];
}
