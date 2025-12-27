import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DailyQuizScreen from '../screens/DailyQuizScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import BattleModeScreen from '../screens/BattleModeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import LanguageStatsScreen from '../screens/LanguageStatsScreen';
import GameScreen from '../screens/GameScreen';
import MatchResultsScreen from '../screens/MatchResultsScreen';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="BattleMode" component={BattleModeScreen} />
          <Stack.Screen name="DailyQuiz" component={DailyQuizScreen} />
          <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
          <Stack.Screen name="GameScreen" component={GameScreen} />
          <Stack.Screen name="MatchResults" component={MatchResultsScreen} />
          <Stack.Screen name="Flashcards" component={FlashcardsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="LanguageStats" component={LanguageStatsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
