# Game Logic Implementation

This document describes the complete game logic implementation for the language learning app.

## Overview

The game system supports competitive language learning through various game modes with language-specific ELO ratings, difficulty-based matchmaking, and comprehensive winner determination.

## Features Implemented

### 1. Multi-Language ELO System

Each user has separate ELO ratings for 8 languages:
- Portuguese
- Spanish
- English
- Italian
- French
- German
- Japanese
- Korean

**Database Schema:**
- `LanguageStats` model tracks per-language statistics
- Includes: eloRating, division, wins, losses, draws, totalMatches
- Automatically created on first match for each language

### 2. Game Modes

#### Battle Mode
- **Questions:** Always 5 questions
- **Duration:** 45 seconds per question
- **Difficulty:** ELO-based automatic difficulty selection
  - Beginner (< 1100 ELO): Easy only
  - Mid-ladder (1100-1699): Easy to Medium
  - High-ELO (1700-2299): Medium to Hard
  - Top percent (>= 2300): Hard only
- **ELO:** Affects rating for the selected language

#### Custom Lobby
- **Questions:** 10 questions
- **Duration:** User-selectable (30, 45, or 60 seconds)
- **Difficulty:** User-selectable (Easy, Medium, Hard)
- **Power-ups:** Optional (enabled/disabled)
- **ELO:** No rating changes (practice mode)

#### Ranked Mode
- **Questions:** 10 questions
- **Duration:** Default timing
- **Difficulty:** ELO-based
- **ELO:** Affects rating for the selected language

#### Casual Mode
- **Questions:** 10 questions
- **Duration:** Default timing
- **Difficulty:** Mixed
- **ELO:** No rating changes

### 3. Winner Determination

Winners are determined by a three-tier system:

1. **Primary:** Most correct answers wins
2. **Secondary:** If tied on accuracy, fastest total time wins
3. **Tertiary:** If still tied, match is a draw

**Implementation:** `gameService.determineWinner()`

### 4. Question Selection

Questions are selected based on:
- **Language:** Match language
- **Difficulty:** Based on match type and average player ELO
- **Randomization:** Random selection from eligible questions

**ELO-based difficulty mapping:**
```typescript
< 1100:        [EASY]
1100 - 1699:   [EASY, MEDIUM]
1700 - 2299:   [MEDIUM, HARD]
>= 2300:       [HARD]
```

### 5. Matchmaking

**Criteria:**
- Same match type
- Same language
- Similar ELO (expanding search range over time)
- For custom lobbies: matching settings

**Search Range:**
- Initial: ±100-200 ELO
- Expands every 20 seconds
- Maximum multiplier: 3x

### 6. Answer Processing

Each answer submission includes:
- Answer selection
- Time taken (in milliseconds)
- Automatic correctness validation

**Database Storage:**
```json
{
  "questionId": {
    "answer": "A",
    "timeMs": 12500,
    "correct": true
  }
}
```

## API Endpoints

### Match Management

```
POST   /api/match/find          - Join matchmaking and find match
POST   /api/match/leave          - Leave matchmaking lobby
POST   /api/match/submit         - Submit match results
GET    /api/match/:matchId       - Get match details
GET    /api/match/status         - Check matchmaking status
```

**Example: Start Battle Mode**
```json
POST /api/match/find
{
  "type": "BATTLE",
  "language": "ENGLISH",
  "isBattleMode": true
}
```

**Example: Custom Lobby**
```json
POST /api/match/find
{
  "type": "CUSTOM",
  "language": "SPANISH",
  "customSettings": {
    "questionDuration": 45,
    "difficulty": "MEDIUM",
    "powerUpsEnabled": false
  }
}
```

**Example: Submit Results**
```json
POST /api/match/submit
{
  "matchId": "uuid",
  "answers": {
    "question-id-1": {
      "answer": "A",
      "timeMs": 12500
    },
    "question-id-2": {
      "answer": "C",
      "timeMs": 8300
    }
  }
}
```

### Language Statistics

```
GET    /api/language-stats              - Get all language stats
GET    /api/language-stats/:language    - Get stats for specific language
GET    /api/language-stats/:language/leaderboard  - Get language leaderboard
GET    /api/language-stats/:language/history      - Get match history
```

## WebSocket Events

### Client -> Server

```javascript
// Join matchmaking
socket.emit('matchmaking:join', { type: 'BATTLE', language: 'ENGLISH' });

// Leave matchmaking
socket.emit('matchmaking:leave');

// Join match room
socket.emit('game:join_match', { matchId: 'uuid' });

// Notify answer submitted
socket.emit('game:answer_submitted', { matchId: 'uuid', questionId: 'uuid' });

// Leave match
socket.emit('game:leave_match', { matchId: 'uuid' });
```

### Server -> Client

```javascript
// Match found
socket.on('matchmaking:match_found', (data) => {
  // data includes match details, questions, participants
});

// Lobby update
socket.on('matchmaking:lobby_update', (data) => {
  // data includes current lobby status
});

// Opponent answered a question
socket.on('game:opponent_answered', (data) => {
  // data includes questionId
});

// Match completed
socket.on('match:completed', (data) => {
  // data includes winnerId, results, ELO changes, division changes
});
```

## Database Schema

### LanguageStats
```prisma
model LanguageStats {
  id        String   @id @default(uuid())
  userId    String
  language  Language
  eloRating Int      @default(1000)
  division  Division @default(BRONZE)
  totalMatches Int   @default(0)
  wins      Int      @default(0)
  losses    Int      @default(0)
  draws     Int      @default(0)

  @@unique([userId, language])
}
```

### Match
```prisma
model Match {
  id               String      @id @default(uuid())
  type             MatchType
  status           MatchStatus
  language         Language
  questions        Json

  // Custom settings
  questionDuration Int?
  difficulty       QuestionDifficulty?
  powerUpsEnabled  Boolean @default(false)
  isBattleMode     Boolean @default(false)
}
```

### MatchResult
```prisma
model MatchResult {
  id             String   @id @default(uuid())
  matchId        String
  userId         String
  score          Int
  correctAnswers Int
  totalTimeMs    Int
  answers        Json
  eloChange      Int?
}
```

## Services

### GameService (`backend/src/services/gameService.ts`)

**Methods:**
- `getDifficultyFromElo()` - Maps ELO to difficulty levels
- `selectQuestions()` - Selects appropriate questions
- `determineWinner()` - Determines match winner
- `processAnswers()` - Validates and scores answers
- `getOrCreateLanguageStats()` - Manages language stats
- `updateLanguageStats()` - Updates ELO and stats after match

### MatchmakingService (`backend/src/services/matchmakingService.ts`)

**Methods:**
- `joinLobby()` - Add player to matchmaking
- `findMatch()` - Find suitable opponent
- `createMatch()` - Create match instance
- `leaveLobby()` - Remove from matchmaking

## Migration Instructions

1. Generate Prisma migration:
```bash
cd backend
npx prisma migrate dev --name add_game_logic
```

2. Apply migration:
```bash
npx prisma migrate deploy
```

3. Generate Prisma client:
```bash
npx prisma generate
```

## Testing the Implementation

### Test Battle Mode

1. Create two users
2. Both join battle mode for the same language
3. System automatically matches based on ELO
4. Both receive 5 questions (45s each)
5. Submit answers with timing data
6. System determines winner and updates language-specific ELO

### Test Custom Lobby

1. User creates custom lobby with specific settings
2. Another user creates lobby with matching settings
3. System matches them together
4. Both play with custom configuration
5. No ELO changes applied

### Test Winner Determination

**Scenario 1: Different accuracy**
- Player A: 4/5 correct, 120s total
- Player B: 3/5 correct, 100s total
- Winner: Player A (better accuracy)

**Scenario 2: Same accuracy, different time**
- Player A: 4/5 correct, 120s total
- Player B: 4/5 correct, 100s total
- Winner: Player B (faster)

**Scenario 3: Complete tie**
- Player A: 4/5 correct, 100s total
- Player B: 4/5 correct, 100s total
- Result: Draw

## Future Enhancements

Potential additions:
- Power-up system implementation
- Team battles (2v2, 3v3)
- Tournament mode
- Seasonal rankings
- Achievement system
- Replay system
- Practice mode against AI
