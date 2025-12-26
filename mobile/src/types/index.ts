export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  eloRating: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  type: string;
}

export interface DailyQuiz {
  id: string;
  questions: Question[];
  completed: boolean;
}

export interface Match {
  id: string;
  type: 'RANKED' | 'CASUAL';
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  questions: Question[];
  participants: User[];
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
  Matchmaking: undefined;
  Profile: undefined;
  Leaderboard: undefined;
};
