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

export enum Language {
  PORTUGUESE = 'PORTUGUESE',
  SPANISH = 'SPANISH',
  ENGLISH = 'ENGLISH',
  ITALIAN = 'ITALIAN',
  FRENCH = 'FRENCH',
  GERMAN = 'GERMAN',
  JAPANESE = 'JAPANESE',
  KOREAN = 'KOREAN',
}

export enum QuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum MatchType {
  RANKED = 'RANKED',
  CASUAL = 'CASUAL',
  CUSTOM = 'CUSTOM',
  BATTLE = 'BATTLE',
}

export interface DivisionInfo {
  division: Division;
  tier: number;
  minElo: number;
  maxElo: number;
  color: string;
  displayName: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  eloRating: number;
  division: Division;
  divisionInfo?: DivisionInfo;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}

export interface LanguageStats {
  id: string;
  userId: string;
  language: Language;
  eloRating: number;
  division: Division;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  type: string;
  difficulty?: QuestionDifficulty;
  language?: Language;
}

export interface AnswerData {
  answer: string;
  timeMs: number;
  correct?: boolean;
}

export interface DailyQuiz {
  id: string;
  questions: Question[];
  completed: boolean;
}

export interface CustomSettings {
  questionDuration: number; // 30, 45, or 60
  difficulty: QuestionDifficulty;
  powerUpsEnabled: boolean;
}

export interface Match {
  id: string;
  type: MatchType;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  language: Language;
  questions: Question[];
  participants: User[];
  startedAt?: string;
  endedAt?: string;

  // Custom lobby settings
  questionDuration?: number;
  difficulty?: QuestionDifficulty;
  powerUpsEnabled: boolean;

  // Battle mode
  isBattleMode: boolean;

  // Async mode settings
  isAsync: boolean;
  currentTurnUserId?: string;  // Which player's turn it is
  turnDeadlineAt?: string;  // When current turn expires
  turnDurationHours: number;  // Hours allowed per turn (default 24h = 1 day)
}

export interface MatchResult {
  id: string;
  matchId: string;
  userId: string;
  score: number;
  correctAnswers: number;
  totalTimeMs: number;
  answers: Record<string, AnswerData>;
  eloChange?: number;
}

export interface GameResult {
  userId: string;
  correctAnswers: number;
  totalTimeMs: number;
  score: number;
}

export interface MatchCompletedEvent {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  results: GameResult[];
  eloChanges?: Array<{
    id: string;
    newRating: number;
    change: number;
  }>;
  divisionChanges?: Array<{
    userId: string;
    oldDivision: string;
    newDivision: string;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  DailyQuiz: undefined;
  Matchmaking: { language?: Language; mode?: MatchType };
  BattleMode: { language: Language };
  CustomLobby: { language: Language };
  GameScreen: { matchId: string; match: Match };
  MatchResults: { matchId: string; result: MatchCompletedEvent };
  Profile: undefined;
  Leaderboard: { language: Language };
  LanguageStats: undefined;
  Flashcards: undefined;
};
