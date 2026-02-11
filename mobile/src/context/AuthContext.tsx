import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, userService, setOnUnauthorized } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle unauthorized (401) responses by clearing auth state
  const handleUnauthorized = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // Register the unauthorized callback
    setOnUnauthorized(handleUnauthorized);
    loadStoredAuth();
  }, [handleUnauthorized]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        // Validate the token by fetching the user profile
        try {
          const response = await userService.getProfile();
          const validatedUser = response.data.user;

          // Token is valid, update with fresh user data
          setToken(storedToken);
          setUser(validatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(validatedUser));
        } catch (error: any) {
          // Token is invalid (401 will be handled by interceptor)
          // Clear stored data if not already cleared
          if (error.response?.status === 401) {
            console.log('Stored token expired, redirecting to login');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password);
    const { user, token } = response.data;

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    const response = await authService.register(email, username, password, displayName);
    const { user, token } = response.data;

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (!token) return;

      const response = await userService.getProfile();
      const updatedUser = response.data.user;

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      if (!token) return;

      // Mark onboarding as complete on the server
      await userService.completeOnboarding();

      // Refresh user data to get updated onboarding status
      await refreshUser();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
