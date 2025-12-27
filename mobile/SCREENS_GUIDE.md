# Mobile Screens Implementation Guide

This document describes all the mobile screens implemented for the Language Learning App.

## Screen Structure

### Authentication Screens

#### LoginScreen (`mobile/src/screens/LoginScreen.tsx`)
- **Purpose**: User authentication
- **Features**:
  - Username/password login
  - Demo account quick login
  - Navigation to registration
  - Loading states
  - Error handling
- **Design**: Blue gradient background with clean white inputs

#### RegisterScreen (`mobile/src/screens/RegisterScreen.tsx`)
- **Purpose**: New user registration
- **Features**:
  - Email, username, password, display name inputs
  - Form validation
  - Password length validation
  - Loading states
  - Error handling
- **Design**: Purple gradient background with scrollable form

### Main Menu

#### HomeScreen (`mobile/src/screens/HomeScreen.tsx`)
- **Purpose**: Main navigation hub
- **Features**:
  - Welcome header with user info
  - Stats cards (Streak, Points, ELO)
  - Battle Modes section:
    - Ranked Battle (⚔️)
    - Casual Battle (🎮)
  - Challenges section:
    - Daily Challenge (📝)
    - Achievements (🏆)
  - Learn section:
    - Flashcards (📚)
  - Your Stats section:
    - Profile (👤)
    - Leaderboard (🏅)
    - Settings (⚙️)
  - Performance summary card
  - Pull-to-refresh
- **Navigation**: Hub for all app features

### Battle & Game Screens

#### BattleModeScreen (`mobile/src/screens/BattleModeScreen.tsx`)
- **Purpose**: Language selection for battles
- **Features**:
  - Battle mode rules display
  - 8 language cards with flags
  - Language-specific statistics:
    - ELO rating
    - Division
    - Total matches
    - Win rate
  - Loading states during matchmaking
  - Automatic navigation when match found
- **Game Modes Supported**:
  - Ranked Battle (affects ELO)
  - Casual Battle (practice mode)
- **Design**: Clean cards with country flags and color-coded stats

### Statistics & Progress

#### LanguageStatsScreen (`mobile/src/screens/LanguageStatsScreen.tsx`)
- **Purpose**: View detailed stats for all languages
- **Features**:
  - All 8 languages displayed
  - Sorted by ELO rating (highest first)
  - "Best Language" badge on top
  - Expandable cards showing:
    - Matches, Wins, Losses, Draws
    - Win rate percentage
    - Link to language leaderboard
  - Pull-to-refresh
  - Info card explaining multi-language ELO
- **Design**: Expandable accordion-style cards with language colors

#### AchievementsScreen (`mobile/src/screens/AchievementsScreen.tsx`)
- **Purpose**: Track and display achievements
- **Features**:
  - Progress tracking (X/Y unlocked)
  - Category filters:
    - All (🏆)
    - Battles (⚔️)
    - Streak (🔥)
    - Learning (📚)
    - Elite (👑)
  - Rarity system:
    - Common (gray)
    - Rare (blue)
    - Epic (purple)
    - Legendary (gold)
  - Progress bars for locked achievements
  - Checkmarks for unlocked
- **Achievements Included** (sample):
  - First Victory
  - Battle Master (100 wins)
  - Week Warrior (7-day streak)
  - Century Streak (100 days)
  - Polyglot (all languages)
  - Perfect Score
  - Speed Demon
  - Division milestones
- **Design**: Color-coded cards with rarity badges

### Settings & Account

#### SettingsScreen (`mobile/src/screens/SettingsScreen.tsx`)
- **Purpose**: App configuration and account management
- **Sections**:
  - **Account**:
    - Profile link
    - Email display
  - **Preferences**:
    - Push Notifications (toggle)
    - Sound Effects (toggle)
    - Auto-match (toggle)
  - **Game**:
    - Language Stats
    - Achievements
    - Match History
  - **Support & Info**:
    - Help & FAQ
    - Tutorial
    - Rate the App
    - About (version info)
  - **Logout Button** (red, bottom)
- **Design**: iOS Settings-style grouped list

### Existing Screens (Updated)

#### DailyQuizScreen
- Daily challenge quiz
- Maintains streak

#### MatchmakingScreen
- Real-time matchmaking
- Waiting for opponent

#### ProfileScreen
- User statistics
- Match history
- Division info

#### LeaderboardScreen
- Top players ranking
- Now supports language-specific leaderboards

#### FlashcardsScreen
- Study mode
- Card flipping animations

## Navigation Flow

```
Login/Register
    ↓
HomeScreen (Main Hub)
    ├── Ranked Battle → BattleModeScreen → (Language Selection) → Matchmaking
    ├── Casual Battle → BattleModeScreen → (Language Selection) → Matchmaking
    ├── Daily Challenge → DailyQuizScreen
    ├── Achievements → AchievementsScreen
    ├── Flashcards → FlashcardsScreen
    ├── Profile → ProfileScreen
    ├── Leaderboard → LanguageStatsScreen → (Language) → LeaderboardScreen
    └── Settings → SettingsScreen
```

## API Integration

All screens use the updated API service (`mobile/src/services/api.ts`) which includes:

### Match Service
```typescript
matchService.findMatch(type, language, options)
matchService.leaveLobby()
matchService.submitMatchResult(matchId, answers)
matchService.getMatch(matchId)
matchService.checkStatus(type)
```

### Language Stats Service
```typescript
languageStatsService.getAllStats()
languageStatsService.getStatsForLanguage(language)
languageStatsService.getLeaderboard(language, limit, offset)
languageStatsService.getMatchHistory(language, limit, offset)
```

## Design System

### Colors
- **Primary Blue**: #4A90E2 (actions, links)
- **Success Green**: #34C759 (positive actions)
- **Danger Red**: #FF3B30 (destructive actions, ranked)
- **Warning Orange**: #FF9500 (highlights)
- **Purple**: #5856D6 (special features)
- **Background**: #f5f5f5 (main bg)
- **White**: Cards and containers

### Typography
- **Headers**: 24-32px, bold
- **Titles**: 16-18px, bold
- **Body**: 14-16px, regular
- **Captions**: 12-13px, regular

### Components
- **Cards**: White background, rounded corners (12px), shadow
- **Buttons**: Rounded (12px), shadow, bold text
- **Input Fields**: White, rounded (12px), 16px padding
- **Stats Displays**: Icon + Value + Label format

## Testing the Screens

### Test Flow
1. **Login** → Use demo account or create new
2. **Home** → View all menu options
3. **Ranked Battle** → Select language → Wait for match
4. **Language Stats** → View all language stats
5. **Achievements** → Browse categories
6. **Settings** → Toggle preferences
7. **Logout** → Return to login

### Key Features to Test
- [ ] Login with demo account
- [ ] Navigate to all screens from home
- [ ] Select language in battle mode
- [ ] Expand language stats cards
- [ ] Filter achievements by category
- [ ] Toggle settings switches
- [ ] Logout confirmation

## Future Enhancements

Planned features:
- [ ] Game Screen (active battle UI)
- [ ] Match Results Screen
- [ ] Custom Lobby Screen (configure settings)
- [ ] Tutorial/Onboarding flow
- [ ] Push notification settings
- [ ] Dark mode toggle
- [ ] Language preference selector
- [ ] Friend system
- [ ] Chat/messaging

## Notes

- All screens support pull-to-refresh where applicable
- Loading states implemented for async operations
- Error handling with user-friendly alerts
- Navigation uses React Navigation stack
- All screens are responsive to different screen sizes
- Accessibility considerations for screen readers
