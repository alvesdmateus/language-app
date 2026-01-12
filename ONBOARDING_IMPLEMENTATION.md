# Onboarding System Implementation

## ✅ COMPLETED (Phase 1)

### 1. Database Schema Updates
**File:** `backend/prisma/schema.prisma`

Added to User model:
```prisma
// Onboarding
onboardingCompleted Boolean @default(false)
favoriteLanguage Language?
tutorialStep Int @default(0)  // Track which step they're on (0 = not started)
```

- ✅ Schema pushed to database successfully
- ✅ Prisma Client regenerated

---

### 2. Frontend Type Updates
**File:** `mobile/src/types/index.ts`

Updated User interface:
```typescript
// Onboarding
onboardingCompleted: boolean;
favoriteLanguage?: Language;
tutorialStep: number;
```

Added navigation routes:
- `OnboardingWelcome`
- `OnboardingTutorial`
- `OnboardingLanguage`
- `OnboardingFirstBattle`

---

### 3. Backend API Endpoints
**Files:**
- `backend/src/controllers/userController.ts`
- `backend/src/routes/user.ts`

**New Endpoints:**

1. **PUT `/api/users/favorite-language`**
   - Updates user's favorite language
   - Validates language is in allowed list
   - Returns updated user object

2. **PUT `/api/users/complete-onboarding`**
   - Marks onboarding as completed
   - Sets tutorialStep to 100
   - Returns updated user object

---

### 4. Frontend API Service
**File:** `mobile/src/services/api.ts`

Added to `userService`:
```typescript
updateFavoriteLanguage: async (language: string)
completeOnboarding: async ()
```

---

### 5. Onboarding Screens Created

#### **OnboardingWelcomeScreen.tsx** ✅
**Path:** `mobile/src/screens/onboarding/OnboardingWelcomeScreen.tsx`

**Features:**
- Hero animation (fade in + slide up)
- App introduction with 🌍 emoji
- 3 key features highlighted:
  - ⚔️ Battle Players Worldwide
  - 🏆 Climb the Rankings
  - 🔥 Use Strategic Power-Ups
- "Let's Get Started" CTA
- Duration indicator ("Takes less than 60 seconds")

**Flow:** User taps "Start" → Navigate to Tutorial

---

#### **OnboardingTutorialScreen.tsx** ✅
**Path:** `mobile/src/screens/onboarding/OnboardingTutorialScreen.tsx`

**Features:**
- 4-step tutorial with progress dots
- Each step explains a core concept:
  1. ⚔️ Battle Mode - 5 questions, 45s each
  2. ⏱️ Beat the Timer - Answer quickly and accurately
  3. 🔥 Power-Ups - Freeze/Burn strategic usage
  4. 🏆 Climb the Ranks - ELO system and 8 divisions

**Navigation:**
- Skip button (top right)
- Back button (if not on first step)
- Next/Continue button
- Time remaining indicator
- Progress dots show current step

**Flow:** Complete tutorial or skip → Navigate to Language Selection

---

#### **OnboardingLanguageScreen.tsx** ✅
**Path:** `mobile/src/screens/onboarding/OnboardingLanguageScreen.tsx`

**Features:**
- 8 language cards in grid layout (2 columns)
- Each card shows:
  - Flag emoji (48px)
  - English name
  - Native name (italic)
  - Checkmark when selected
- Visual selection feedback:
  - Blue border & background when selected
  - Increased shadow elevation
- "Continue to First Battle" button (disabled until selection)
- Footer note: "You can change this later in settings"

**Languages:**
- 🇪🇸 Spanish (Español)
- 🇧🇷 Portuguese (Português)
- 🇫🇷 French (Français)
- 🇩🇪 German (Deutsch)
- 🇮🇹 Italian (Italiano)
- 🇯🇵 Japanese (日本語)
- 🇰🇷 Korean (한국어)
- 🇺🇸 English (English)

**API Integration:**
- Calls `userService.updateFavoriteLanguage()`
- Shows loading spinner during API call
- Error handling with Alert

**Flow:** Select language → API call → Navigate to First Battle

---

## 🚧 REMAINING WORK (Phase 2)

### 1. CPU Opponent Logic
**File to create:** `backend/src/services/cpuOpponentService.ts`

**Requirements:**
- Generate CPU opponent for first battle
- CPU should be beginner-friendly (not too difficult)
- Simulate answer times (randomized but realistic)
- Answer accuracy ~60-70% to make it winnable
- Use player's selected language
- Track as a special match type (CPU_MATCH?)

**Implementation Plan:**
```typescript
class CPUOpponentService {
  // Generate CPU opponent data
  generateCPUOpponent(): CPUPlayer {
    return {
      id: 'cpu-opponent',
      username: 'Training Bot',
      displayName: 'Training Bot',
      eloRating: 800, // Below starting ELO
      difficulty: 'easy',
    };
  }

  // Simulate CPU answers
  async simulateCPUAnswers(questions: Question[]): Promise<CPUAnswers> {
    // 60-70% accuracy
    // Random time between 5-35 seconds per question
    // Return answer object matching MatchResult format
  }

  // Create CPU match
  async createCPUMatch(userId: string, language: Language): Promise<Match> {
    // Create a special match with CPU opponent
    // Generate questions
    // Return match object
  }
}
```

---

### 2. First Battle Screen
**File to create:** `mobile/src/screens/onboarding/OnboardingFirstBattleScreen.tsx`

**Requirements:**
- Brief introduction: "Time for your first battle!"
- Explain it's a practice match against Training Bot
- Show Training Bot profile card
- "Start Battle" button
- Creates CPU match via API
- Navigates to GameScreen with CPU match

**Flow:**
- Display introduction
- User taps "Start Battle"
- API creates CPU match
- Navigate to GameScreen
- After match completes → Call `completeOnboarding()`
- Navigate to Home

---

### 3. Navigation Integration
**File to update:** `mobile/src/navigation/RootNavigator.tsx`

**Changes Needed:**

1. **Import onboarding screens:**
```typescript
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import OnboardingTutorialScreen from '../screens/onboarding/OnboardingTutorialScreen';
import OnboardingLanguageScreen from '../screens/onboarding/OnboardingLanguageScreen';
import OnboardingFirstBattleScreen from '../screens/onboarding/OnboardingFirstBattleScreen';
```

2. **Add routes to Stack.Navigator:**
```typescript
<Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
<Stack.Screen name="OnboardingTutorial" component={OnboardingTutorialScreen} />
<Stack.Screen name="OnboardingLanguage" component={OnboardingLanguageScreen} />
<Stack.Screen name="OnboardingFirstBattle" component={OnboardingFirstBattleScreen} />
```

3. **Add onboarding check logic:**
```typescript
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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
        </>
      ) : (
        // Main app screens
        <>
          <Stack.Screen name="Home" component={MainTabs} />
          {/* ... rest of screens */}
        </>
      )}
    </Stack.Navigator>
  );
};
```

---

### 4. Auth Context Update
**File to update:** `mobile/src/context/AuthContext.tsx`

**Changes Needed:**
- Ensure `user` object includes new onboarding fields
- Refresh user data after onboarding completion
- Add method to mark onboarding complete locally

```typescript
const refreshUser = async () => {
  const userData = await userService.getProfile();
  setUser(userData.data);
};

const completeOnboarding = async () => {
  await userService.completeOnboarding();
  await refreshUser();
};
```

---

### 5. Backend CPU Match Support
**Files to update:**
- `backend/prisma/schema.prisma` - Add `isCPUMatch` boolean to Match model
- `backend/src/controllers/matchController.ts` - Add `createCPUMatch` endpoint
- `backend/src/routes/match.ts` - Add route for CPU match creation

**New Endpoint:**
```typescript
POST /api/match/cpu
Body: { language: Language }
Response: { matchId: string, match: Match }
```

**CPU Match Logic:**
- Don't use matchmaking queue
- Create match immediately
- Generate questions based on language
- Mark as `isCPUMatch: true`
- Pre-populate CPU opponent answers (simulated)
- When user submits, immediately calculate results and emit `match:completed`

---

## 📋 TESTING CHECKLIST

### Flow Testing
- [ ] New user registers → Sees onboarding welcome screen
- [ ] Welcome screen animations work smoothly
- [ ] Tutorial navigation (next/back/skip) works correctly
- [ ] Progress dots update correctly
- [ ] Language selection validates before continuing
- [ ] API call to save favorite language succeeds
- [ ] First battle screen displays correctly
- [ ] CPU match creates successfully
- [ ] GameScreen works with CPU opponent
- [ ] Match completes and shows results
- [ ] Onboarding marked as complete
- [ ] User redirected to Home after completion
- [ ] Returning users skip onboarding (go straight to Home)

### Edge Cases
- [ ] Skip button works from any tutorial step
- [ ] Back button works correctly
- [ ] Network errors handled gracefully
- [ ] User can change language selection before continuing
- [ ] CPU match doesn't affect ELO (or uses separate CPU ELO tracking)
- [ ] Existing users aren't forced through onboarding

### Visual Testing
- [ ] All animations smooth (60fps)
- [ ] Text readable on all screen sizes
- [ ] Buttons accessible and properly sized
- [ ] Colors match app theme
- [ ] Icons display correctly
- [ ] Loading states show during API calls

---

## 🎯 ESTIMATED COMPLETION TIME

Based on remaining work:

- **CPU Opponent Logic**: 2-3 hours
- **First Battle Screen**: 1 hour
- **Navigation Integration**: 1 hour
- **Auth Context Updates**: 30 minutes
- **Backend CPU Match Support**: 1-2 hours
- **Testing & Bug Fixes**: 2 hours

**Total**: ~8-10 hours of work remaining

---

## 💡 FUTURE ENHANCEMENTS (Post-MVP)

Once basic onboarding works:

1. **Skip for Returning Users**
   - Add "Skip Tutorial" option for users who already know how to play
   - Show quick language selection screen only

2. **Onboarding Analytics**
   - Track where users drop off
   - Measure completion rates
   - A/B test tutorial content

3. **Personalized Difficulty**
   - Ask user their language proficiency level
   - Adjust first battle difficulty accordingly
   - Set initial ELO based on self-reported skill

4. **Interactive Tutorial**
   - Mini-game demos for each concept
   - Let users try power-ups in tutorial
   - Practice question before real battle

5. **Gamified Progress**
   - Achievement for completing onboarding
   - Welcome bonus (coins/points)
   - First-time player badge

6. **Social Onboarding**
   - Optional: Connect with friends
   - Find players learning same language
   - Join language-specific communities

---

## 📝 FILES SUMMARY

### ✅ Created/Modified (Phase 1):
1. `backend/prisma/schema.prisma` ✅
2. `mobile/src/types/index.ts` ✅
3. `backend/src/controllers/userController.ts` ✅
4. `backend/src/routes/user.ts` ✅
5. `mobile/src/services/api.ts` ✅
6. `mobile/src/screens/onboarding/OnboardingWelcomeScreen.tsx` ✅
7. `mobile/src/screens/onboarding/OnboardingTutorialScreen.tsx` ✅
8. `mobile/src/screens/onboarding/OnboardingLanguageScreen.tsx` ✅

### 🚧 To Create/Modify (Phase 2):
9. `backend/src/services/cpuOpponentService.ts` (NEW)
10. `mobile/src/screens/onboarding/OnboardingFirstBattleScreen.tsx` (NEW)
11. `mobile/src/navigation/RootNavigator.tsx` (UPDATE)
12. `mobile/src/context/AuthContext.tsx` (UPDATE)
13. `backend/src/controllers/matchController.ts` (UPDATE)
14. `backend/src/routes/match.ts` (UPDATE)

---

## 🚀 NEXT STEPS

**To complete onboarding:**

1. Build CPU opponent service (backend)
2. Create First Battle screen (frontend)
3. Integrate onboarding check into navigation
4. Update Auth context
5. Add CPU match endpoint
6. Test end-to-end flow
7. Fix bugs and polish UX

**Priority Order:**
1. CPU Opponent Logic (critical path)
2. Navigation Integration (unblocks testing)
3. First Battle Screen (connects the flow)
4. Testing & Polish

The foundation is solid! The remaining work is primarily integrating what's been built and creating the CPU opponent logic.
