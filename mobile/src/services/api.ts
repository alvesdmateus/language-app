import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';

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
  findMatch: async (type: 'RANKED' | 'CASUAL') => {
    const response = await api.post('/match/find', { type });
    return response.data;
  },
  leaveLobby: async () => {
    const response = await api.post('/match/leave');
    return response.data;
  },
  submitMatchResult: async (matchId: string, answers: Record<string, string>) => {
    const response = await api.post('/match/submit', { matchId, answers });
    return response.data;
  },
};

export default api;
