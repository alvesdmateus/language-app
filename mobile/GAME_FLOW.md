# Complete Game Flow Documentation

This document describes the complete battle game flow from start to finish.

## Game Flow Overview

```
Home Screen
    ↓
Battle Mode Selection (Ranked/Casual)
    ↓
Language Selection
    ↓
Matchmaking
    ↓
Game Screen (Answer Questions)
    ↓
Match Results
    ↓
Play Again / Home
```

## Detailed Flow

### 1. Home Screen
**File**: `mobile/src/screens/HomeScreen.tsx`

User selects battle mode:
- **Ranked Battle**: Affects ELO rating
- **Casual Battle**: Practice mode, no ELO changes

**Navigation**:
```typescript
navigation.navigate('BattleMode', { mode: 'RANKED' | 'CASUAL' })
```

### 2. Battle Mode Selection
**File**: `mobile/src/screens/BattleModeScreen.tsx`

**Features**:
- Displays 8 languages with flags
- Shows language-specific stats (ELO, division, win rate)
- Battle rules display:
  - 5 questions per match
  - 45 seconds per question
  - ELO impact (ranked only)
  - Winner determination rules

**User Action**: Select a language

**API Call**:
```typescript
await api.post('/match/find', {
  type: mode === 'RANKED' ? 'BATTLE' : 'CASUAL',
  language: selectedLanguage,
  isBattleMode: true,
});
```

**Navigation**:
- If match found immediately → `GameScreen`
- If waiting for opponent → `Matchmaking`

### 3. Matchmaking Screen
**File**: `mobile/src/screens/MatchmakingScreen.tsx`

**Features**:
- Shows "Searching for opponent..."
- Displays language and mode
- Cancel option
- WebSocket integration for real-time match found

**WebSocket Events**:
```typescript
socket.on('matchmaking:match_found', (matchData) => {
  navigation.navigate('GameScreen', {
    matchId: matchData.matchId,
    match: matchData,
  });
});
```

### 4. Game Screen (Core Gameplay)
**File**: `mobile/src/screens/GameScreen.tsx`

#### Components

**Header**:
- Quit button (with confirmation)
- Match type badge
- Language flag
- Progress bar (Question X of Y)
- Timer (circle + bar)

**Question Card**:
- Question type badge (Grammar/Comprehension)
- Difficulty badge (Easy/Medium/Hard)
- Question text

**Answer Options**:
- 4 multiple choice options (A, B, C, D)
- Visual feedback on selection
- Touch to select

**Footer**:
- Next Question / Submit Match button
- Disabled until answer selected

#### Game Logic

**Timer System**:
```typescript
// Start timer when question loads
setQuestionStartTime(Date.now());
setTimeRemaining(questionDuration); // 45s for battle mode

// Countdown every second
timerRef.current = setInterval(() => {
  setTimeRemaining((prev) => {
    if (prev <= 1) {
      handleTimeUp(); // Auto-submit when time runs out
      return 0;
    }
    return prev - 1;
  });
}, 1000);
```

**Answer Selection**:
```typescript
const handleAnswerSelect = (answer: string) => {
  setSelectedAnswer(answer);
};
```

**Next Question**:
```typescript
const handleNextQuestion = () => {
  // Calculate time taken
  const timeMs = Date.now() - questionStartTime;

  // Store answer with timing
  const newAnswers = {
    ...answers,
    [currentQuestion.id]: {
      answer: selectedAnswer,
      timeMs,
    },
  };

  // Move to next or submit
  if (isLastQuestion) {
    submitMatch(newAnswers);
  } else {
    setCurrentQuestionIndex((prev) => prev + 1);
  }
};
```

**Answer Submission**:
```typescript
const submitMatch = async (finalAnswers) => {
  const response = await matchService.submitMatchResult(
    matchId,
    finalAnswers // { questionId: { answer, timeMs } }
  );

  navigation.navigate('MatchResults', {
    matchId,
    result: response.data,
  });
};
```

#### Visual Features

**Timer Colors**:
- Green: >10 seconds
- Orange: 6-10 seconds
- Red: ≤5 seconds

**Animations**:
- Progress bar smooth transition
- Shake animation on time up
- Scale animation on answer select
- Fade transitions between questions

**States**:
- Loading (initial)
- Playing (normal)
- Paused (time up, submitting)
- Submitting (final submission)

### 5. Match Results Screen
**File**: `mobile/src/screens/MatchResultsScreen.tsx`

#### Result Display

**Header**:
- Result emoji (🏆 Victory / 😔 Defeat / 🤝 Draw)
- Result text with color
- Explanation (if draw)

**Score Comparison**:
```
┌─────────┐       ┌─────────┐
│   You   │  VS   │Opponent │
│    4    │       │    3    │
│ correct │       │ correct │
└─────────┘       └─────────┘
```
- Winner highlighted with green border
- Time comparison below

**Performance Stats Grid**:
- ✅ Correct answers
- ⏱️ Total time
- ⭐ Points scored
- 📊 Accuracy percentage

**ELO Change** (Ranked only):
```
ELO Rating
1245 → +15 → 1260
```
- Old rating (strikethrough)
- Change (+/- with color)
- New rating (bold)

**Division Change** (if promoted):
```
🎉 Division Promoted!
GOLD → PLATINUM
```

**Info Card**:
- Winner determination explanation
- Rules recap

#### Actions

**Play Again Button**:
- Returns to Battle Mode selection
- Same mode (Ranked/Casual)

**Home Button**:
- Returns to main menu

### 6. Data Flow

#### Question Data Structure
```typescript
interface Question {
  id: string;
  question: string;
  options: string[]; // 4 options
  type: 'grammar' | 'comprehension';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}
```

#### Answer Data Structure
```typescript
interface AnswerData {
  answer: string;      // Selected option
  timeMs: number;      // Time taken in milliseconds
  correct?: boolean;   // Set by backend
}
```

#### Match Data Structure
```typescript
interface Match {
  id: string;
  type: 'RANKED' | 'CASUAL' | 'BATTLE';
  language: Language;
  questions: Question[];
  questionDuration: number; // 45 for battle mode
  isBattleMode: boolean;
  participants: User[];
}
```

#### Result Data Structure
```typescript
interface MatchCompletedEvent {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  results: GameResult[];
  eloChanges?: Array<{
    id: string;
    newRating: number;
    change: number;
  }>;
  divisionChanges?: Array<{
    userId: string;
    oldDivision: string;
    newDivision: string;
  }>;
}
```

### 7. API Endpoints Used

```typescript
// Find match
POST /api/match/find
{
  type: 'BATTLE',
  language: 'ENGLISH',
  isBattleMode: true
}

// Submit results
POST /api/match/submit
{
  matchId: 'uuid',
  answers: {
    'question-id-1': { answer: 'A', timeMs: 12500 },
    'question-id-2': { answer: 'C', timeMs: 8300 }
  }
}
```

### 8. WebSocket Events

```typescript
// Join matchmaking
socket.emit('matchmaking:join', {
  type: 'BATTLE',
  language: 'ENGLISH'
});

// Match found
socket.on('matchmaking:match_found', (matchData) => {
  // Navigate to game screen
});

// Opponent answered (optional, for real-time feedback)
socket.on('game:opponent_answered', (data) => {
  // Show indicator that opponent submitted answer
});

// Match completed
socket.on('match:completed', (result) => {
  // Navigate to results if not already there
});
```

### 9. Game Rules Implementation

#### Winner Determination (3-tier system)

**Primary**: Most correct answers
```typescript
if (player1.correctAnswers > player2.correctAnswers) {
  winner = player1;
}
```

**Secondary**: Fastest total time
```typescript
else if (player1.correctAnswers === player2.correctAnswers) {
  if (player1.totalTimeMs < player2.totalTimeMs) {
    winner = player1;
  }
}
```

**Tertiary**: Draw
```typescript
else if (
  player1.correctAnswers === player2.correctAnswers &&
  player1.totalTimeMs === player2.totalTimeMs
) {
  isDraw = true;
  winner = null;
}
```

#### ELO Calculation (Backend)
```typescript
// Only for RANKED and BATTLE modes
if (match.type === 'RANKED' || match.type === 'BATTLE') {
  const eloResults = calculateMultiPlayerRatings([
    { id: player1.id, rating: player1.eloRating, score: player1.score },
    { id: player2.id, rating: player2.eloRating, score: player2.score }
  ]);

  // Update language-specific ELO
  await updateLanguageStats(player1.id, match.language, eloChange, 'win'|'loss'|'draw');
}
```

### 10. Error Handling

**Network Errors**:
```typescript
try {
  await submitMatch(answers);
} catch (error) {
  Alert.alert('Submission Error', 'Failed to submit. Retry?', [
    { text: 'Retry', onPress: () => submitMatch(answers) },
    { text: 'Exit', onPress: () => navigation.navigate('Home') }
  ]);
}
```

**Timeout Handling**:
```typescript
// Auto-submit when timer reaches 0
if (timeRemaining <= 0) {
  handleTimeUp(); // Submit with no answer
}
```

**Quit Confirmation**:
```typescript
Alert.alert('Quit Match?', 'This will count as a loss.', [
  { text: 'Cancel' },
  { text: 'Quit', style: 'destructive', onPress: quit }
]);
```

### 11. Testing Checklist

**Game Flow**:
- [ ] Select ranked battle
- [ ] Choose language
- [ ] Wait for matchmaking
- [ ] Answer all 5 questions
- [ ] See timer countdown
- [ ] View results screen
- [ ] Check ELO change
- [ ] Play again

**Timer Tests**:
- [ ] Timer counts down correctly
- [ ] Timer color changes (green → orange → red)
- [ ] Auto-submit on time up
- [ ] Shake animation on timeout

**Answer Tests**:
- [ ] Can select each option
- [ ] Visual feedback on selection
- [ ] Next button enabled only when answered
- [ ] Time tracking accurate

**Results Tests**:
- [ ] Correct winner displayed
- [ ] Stats accurate
- [ ] ELO changes shown (ranked)
- [ ] Division changes shown (if applicable)
- [ ] Play again works
- [ ] Home navigation works

**Edge Cases**:
- [ ] No answer submitted (timeout)
- [ ] Network error during submission
- [ ] Quit during match
- [ ] Perfect score (all correct)
- [ ] Zero score (all wrong)
- [ ] Draw scenario

### 12. Performance Optimizations

**Timer**:
- Uses ref to avoid re-renders
- Cleanup on unmount
- Paused during submission

**Animations**:
- Native driver where possible
- Smooth 60fps animations
- Optimized transforms

**State Management**:
- Minimal re-renders
- Batched updates
- Memoized calculations

### 13. Future Enhancements

Potential improvements:
- [ ] Practice mode (review answers)
- [ ] Question explanation after answer
- [ ] Real-time opponent progress
- [ ] Power-ups system
- [ ] Sound effects and haptics
- [ ] Replay match feature
- [ ] Share results
- [ ] Statistics graphs
- [ ] Daily/weekly challenges

## Summary

The complete game flow provides:
✅ Seamless matchmaking experience
✅ Engaging real-time gameplay
✅ Accurate timing tracking
✅ Fair winner determination
✅ Comprehensive results display
✅ Smooth animations and transitions
✅ Error handling and edge cases
✅ Language-specific ELO progression

All screens are implemented and ready for testing with the backend!
