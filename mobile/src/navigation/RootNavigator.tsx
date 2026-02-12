import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DailyQuizScreen from '../screens/DailyQuizScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import LanguageStatsScreen from '../screens/LanguageStatsScreen';
import GameScreen from '../screens/GameScreen';
import MatchResultsScreen from '../screens/MatchResultsScreen';
import MatchHistoryScreen from '../screens/MatchHistoryScreen';
import PowerUpSelectionScreen from '../screens/PowerUpSelectionScreen';
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import OnboardingTutorialScreen from '../screens/onboarding/OnboardingTutorialScreen';
import OnboardingLanguageScreen from '../screens/onboarding/OnboardingLanguageScreen';
import OnboardingFirstBattleScreen from '../screens/onboarding/OnboardingFirstBattleScreen';
import OnboardingCelebrationScreen from '../screens/onboarding/OnboardingCelebrationScreen';
import { RootStackParamList } from '../types';
import { colors, spacing } from '../theme';

// Tab Screens
import BattleModeTab from '../screens/tabs/BattleModeTab';
import ChallengesTab from '../screens/tabs/ChallengesTab';
import LearnTab from '../screens/tabs/LearnTab';
import ProfileTab from '../screens/tabs/ProfileTab';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = ({ navigation }: any) => {
  return (
    <Tab.Navigator
      initialRouteName="BattleTab"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="BattleTab"
        component={BattleModeTab}
        options={{
          title: 'Battle',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sword-cross" size={size} color={color} />
          ),
          headerTitle: 'Battle',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: spacing.lg }}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesTab}
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          headerTitle: 'Challenges',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: spacing.lg }}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearnTab}
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          headerTitle: 'Learn',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: spacing.lg }}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTab}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Profile',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: spacing.lg }}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !user.onboardingCompleted ? (
        // Onboarding flow
        <>
          <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
          <Stack.Screen name="OnboardingTutorial" component={OnboardingTutorialScreen} />
          <Stack.Screen name="OnboardingLanguage" component={OnboardingLanguageScreen} />
          <Stack.Screen name="OnboardingFirstBattle" component={OnboardingFirstBattleScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="MatchResults" component={MatchResultsScreen} />
          <Stack.Screen name="OnboardingCelebration" component={OnboardingCelebrationScreen} />
        </>
      ) : (
        // Main app screens
        <>
          <Stack.Screen name="Home" component={MainTabs} />
          <Stack.Screen name="DailyQuiz" component={DailyQuizScreen} />
          <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
          <Stack.Screen name="PowerUpSelection" component={PowerUpSelectionScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="MatchResults" component={MatchResultsScreen} />
          <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} />
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
