import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { RootStackParamList } from '../types';

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
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
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
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚔️</Text>,
          headerTitle: 'Battle',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesTab}
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏆</Text>,
          headerTitle: 'Challenges',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearnTab}
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📚</Text>,
          headerTitle: 'Learn',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTab}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
          headerTitle: 'Profile',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ fontSize: 24 }}>⚙️</Text>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
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
          <Stack.Screen name="Home" component={MainTabs} />
          <Stack.Screen name="DailyQuiz" component={DailyQuizScreen} />
          <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
          <Stack.Screen name="GameScreen" component={GameScreen} />
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
