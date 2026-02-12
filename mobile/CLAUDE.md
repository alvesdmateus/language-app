# CLAUDE.md - Mobile Client

See root `../CLAUDE.md` for API endpoints, database models, WebSocket events, and design system.

## Architecture

```
src/
├── components/                           # Reusable UI components
│   ├── DivisionBadge.tsx                # Division badge (small/medium/large) + progress card
│   ├── LanguageSelector.tsx             # Bottom-sheet modal picker with per-language stats
│   └── OnboardingGuide.tsx              # Tutorial overlay: animated tooltips, spotlights, progress dots
│
├── context/                              # React Context providers (wrapped in App.tsx)
│   ├── AuthContext.tsx                  # User state, JWT, login/register/logout/refreshUser
│   └── WebSocketContext.tsx             # Socket.IO connection, matchmaking join/leave, heartbeat
│
├── navigation/
│   └── RootNavigator.tsx                # 3-state navigator: Auth | Onboarding | Main (tabs + stack)
│
├── screens/
│   ├── LoginScreen.tsx                  # Email/password login
│   ├── RegisterScreen.tsx               # Account creation (email, username, password, display name)
│   ├── DailyQuizScreen.tsx              # Daily challenge with score submission
│   ├── MatchmakingScreen.tsx            # Waiting lobby with cancel option
│   ├── GameScreen.tsx                   # Core gameplay: questions, timer, power-ups, opponent progress
│   ├── MatchResultsScreen.tsx           # Post-match: scores, ELO changes, division changes
│   ├── MatchHistoryScreen.tsx           # Past matches list
│   ├── ProfileScreen.tsx                # Detailed user profile
│   ├── LeaderboardScreen.tsx            # Global + division-specific rankings
│   ├── LanguageStatsScreen.tsx          # Per-language ELO, record, match history
│   ├── FlashcardsScreen.tsx             # Study flashcards with category filter
│   ├── AchievementsScreen.tsx           # Achievement tracking and display
│   ├── SettingsScreen.tsx               # App settings + logout
│   ├── PowerUpSelectionScreen.tsx       # Pre-match power-up picker (FREEZE/BURN)
│   ├── BattleModeScreen.tsx             # (Legacy) Replaced by BattleModeTab
│   │
│   ├── onboarding/                      # First-time user flow (5 screens)
│   │   ├── OnboardingWelcomeScreen.tsx  # Welcome splash
│   │   ├── OnboardingTutorialScreen.tsx # App walkthrough
│   │   ├── OnboardingLanguageScreen.tsx # Language selection
│   │   ├── OnboardingFirstBattleScreen.tsx # CPU match intro
│   │   └── OnboardingCelebrationScreen.tsx # Post-first-battle celebration
│   │
│   └── tabs/                            # Bottom tab screens (main app shell)
│       ├── BattleModeTab.tsx            # Mode select (Ranked/Casual) + language picker → matchmaking
│       ├── ChallengesTab.tsx            # Daily quiz + challenges
│       ├── LearnTab.tsx                 # Flashcards + learning resources
│       └── ProfileTab.tsx               # Quick stats, division card, recent matches
│
├── services/
│   └── api.ts                           # Axios instance + all API service modules
│
├── theme/                               # Centralized design system
│   ├── index.ts                         # Colors, typography, spacing, shadows, common styles
│   └── languages.ts                     # Language info map (name, flag, color, description)
│
└── types/
    └── index.ts                         # Shared enums, interfaces, navigation param types
```

## Navigation Structure

Three authentication states drive navigation:

```
!user                          → Auth Stack (Login, Register)
user && !onboardingCompleted   → Onboarding Stack (Welcome → Tutorial → Language → FirstBattle → Game → Results → Celebration)
user && onboardingCompleted    → Main Stack:
                                  ├── Home (Bottom Tabs)
                                  │   ├── BattleTab (initial)
                                  │   ├── ChallengesTab
                                  │   ├── LearnTab
                                  │   └── ProfileTab
                                  └── Modal Screens (DailyQuiz, Matchmaking, PowerUpSelection, Game, MatchResults, etc.)
```

- **Stack**: `@react-navigation/native-stack` (native transitions)
- **Tabs**: `@react-navigation/bottom-tabs` with emoji icons
- Navigation types: `RootStackParamList` in `types/index.ts`

## State Management

### AuthContext (`context/AuthContext.tsx`)
- `user`, `token`, `loading` state
- `login()`, `register()`, `logout()`, `refreshUser()`, `completeOnboarding()`
- Persists token + user to AsyncStorage
- Auto-validates token on app start
- Axios interceptor handles 401 → auto-logout

### WebSocketContext (`context/WebSocketContext.tsx`)
- `socket`, `connected` state
- `joinMatchmaking(type)`, `leaveMatchmaking()`, `sendMatchHeartbeat()`
- Connects when user is authenticated, disconnects on logout

- Transport: WebSocket only, 5 reconnection attempts

## API Layer (`services/api.ts`)

Single Axios instance with Bearer token interceptor. Service modules:

| Service              | Methods                                                    |
|---------------------|------------------------------------------------------------|
| `authService`       | `login`, `register`                                        |
| `userService`       | `getProfile`, `getLeaderboard`, `getLanguageStats`, `updateFavoriteLanguage`, `completeOnboarding` |
| `quizService`       | `getDailyQuiz`, `submitDailyQuiz`                          |
| `matchService`      | `findMatch`, `leaveLobby`, `submitMatchResult`, `getMatch`, `checkStatus`, `getUserMatches`, `createCPUMatch`, `submitCPUMatchResult` |
| `flashcardService`  | `getFlashcards`, `getCategories`                           |
| `languageStatsService` | `getAllStats`, `getStatsForLanguage`, `getLeaderboard`, `getMatchHistory` |


## Styling Patterns

- Pure React Native `StyleSheet.create()` — no styled-components or NativeWind
- Centralized design tokens in `theme/index.ts` (colors, typography, spacing, shadows)
- Language constants in `theme/languages.ts` (flag, name, color per language)
- Component patterns: white cards with rounded corners, shadow elevation, colored accents

## Key Dependencies

| Package                          | Version    | Purpose                          |
|---------------------------------|------------|----------------------------------|
| `expo`                          | `~54.0.0`  | Expo SDK                         |
| `react-native`                  | `0.81.5`   | Core framework                   |
| `@react-navigation/native`     | `^7.1.26`  | Navigation container             |
| `@react-navigation/native-stack`| `^7.9.0`  | Native stack navigator           |
| `@react-navigation/bottom-tabs` | `^7.9.0`  | Bottom tab navigator             |
| `socket.io-client`             | `^4.7.2`   | WebSocket client                 |
| `axios`                        | `^1.6.2`   | HTTP client                      |
| `@react-native-async-storage`  | `2.2.0`    | Token/user persistence           |
| `react-native-reanimated`      | `~4.1.1`   | Animations                       |
| `expo-linear-gradient`         | —          | Gradient backgrounds             |

## Screen Pattern

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';

const ExampleScreen = () => {
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/endpoint');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default ExampleScreen;
```

## Development Commands

```bash
cd mobile
npm install              # Install dependencies
npx expo start           # Start Expo dev server
npx expo start --clear   # Start with cleared cache
```

**API URL**: Update `services/api.ts` and `context/WebSocketContext.tsx` with your local IP when developing on a physical device.
