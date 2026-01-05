import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.126:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (email: string, username: string, password: string, displayName?: string) => {
    const response = await api.post('/auth/register', { email, username, password, displayName });
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  getLeaderboard: async (limit = 50) => {
    const response = await api.get(`/users/leaderboard?limit=${limit}`);
    return response.data;
  },
  getLanguageStats: async () => {
    const response = await api.get('/language-stats');
    return response.data;
  },
};

export const quizService = {
  getDailyQuiz: async () => {
    const response = await api.get('/quiz/daily');
    return response.data;
  },
  submitDailyQuiz: async (quizId: string, answers: Record<string, string>) => {
    const response = await api.post('/quiz/daily/submit', { quizId, answers });
    return response.data;
  },
};

export const matchService = {
  findMatch: async (
    type: 'RANKED' | 'CASUAL' | 'BATTLE' | 'CUSTOM',
    language: string,
    options?: {
      isBattleMode?: boolean;
      customSettings?: {
        questionDuration: number;
        difficulty: string;
        powerUpsEnabled: boolean;
      };
    }
  ) => {
    const response = await api.post('/match/find', {
      type,
      language,
      ...options,
    });
    return response.data;
  },
  leaveLobby: async () => {
    const response = await api.post('/match/leave');
    return response.data;
  },
  submitMatchResult: async (
    matchId: string,
    answers: Record<string, { answer: string; timeMs: number }>
  ) => {
    const response = await api.post('/match/submit', { matchId, answers });
    return response.data;
  },
  getMatch: async (matchId: string) => {
    const response = await api.get(`/match/${matchId}`);
    return response.data;
  },
  checkStatus: async (type: string) => {
    const response = await api.get(`/match/status?type=${type}`);
    return response.data;
  },
  getUserMatches: async (status?: 'IN_PROGRESS' | 'COMPLETED') => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/match/user/matches${params}`);
    return response.data;
  },
};

export const flashcardService = {
  getFlashcards: async (
    count = 10,
    language = 'SPANISH',
    category?: string,
    difficulty?: string,
    source?: string
  ) => {
    const params = new URLSearchParams({
      count: count.toString(),
      language: language
    });
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    if (source) params.append('source', source);
    const response = await api.get(`/flashcards?${params.toString()}`);
    return response.data;
  },
  getCategories: async (language = 'SPANISH') => {
    const response = await api.get(`/flashcards/categories?language=${language}`);
    return response.data;
  },
};

export const languageStatsService = {
  getAllStats: async () => {
    const response = await api.get('/language-stats');
    return response.data;
  },
  getStatsForLanguage: async (language: string) => {
    const response = await api.get(`/language-stats/${language}`);
    return response.data;
  },
  getLeaderboard: async (language: string, limit = 100, offset = 0) => {
    const response = await api.get(
      `/language-stats/${language}/leaderboard?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },
  getMatchHistory: async (language: string, limit = 20, offset = 0) => {
    const response = await api.get(
      `/language-stats/${language}/history?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },
};

export { api };
export default api;
