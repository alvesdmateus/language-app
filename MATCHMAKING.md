# Matchmaking System

## Overview

The language learning app uses an ELO-based matchmaking system to create fair and balanced matches between players. The system finds opponents with similar skill levels and calculates rating changes based on match performance.

Players are also assigned to divisions (Unranked to Grandmaster) based on their ELO rating, providing visual progression and competitive goals. See [DIVISIONS.md](./DIVISIONS.md) for complete details on the division system.

## ELO Rating System

### What is ELO?

ELO is a rating system used to calculate the relative skill levels of players. Originally designed for chess, it's widely used in competitive games and sports.

- **Starting Rating**: 1000
- **Rating Range**: 0 to infinity (practically 0-3000+)
- **K-Factor**: 32 (determines rating volatility)

### How ELO Works

1. **Expected Score**: Before a match, the system calculates the probability of each player winning based on the rating difference
2. **Actual Score**: After the match, players receive 1 point for a win, 0.5 for a draw, 0 for a loss
3. **Rating Change**: The difference between expected and actual scores determines rating change

### ELO Calculation Formula

```typescript
expectedScore = 1 / (1 + 10^((opponentRating - playerRating) / 400))
ratingChange = K_FACTOR * (actualScore - expectedScore)
newRating = currentRating + ratingChange
```

### Example

Player A (1200) vs Player B (1180):
- Player A expected score: ~0.53 (53% chance to win)
- Player B expected score: ~0.47 (47% chance to win)

If Player A wins (actual score = 1):
- Player A: +15 rating (1215)
- Player B: -15 rating (1165)

If Player B wins (actual score = 1):
- Player B: +17 rating (1197)
- Player A: -17 rating (1183)

## Matchmaking Algorithm

### Lobby System

The matchmaking system uses an in-memory lobby to track players searching for matches:

1. **Join Lobby**: Player enters the matchmaking queue
2. **Find Opponent**: System searches for suitable opponents
3. **Create Match**: When found, both players are removed from lobby and match begins
4. **Timeout**: Players are removed from lobby after 60 seconds

### ELO-Based Matching

The system finds opponents using these criteria:

#### 1. Initial Search Range
```typescript
baseRange = max(100, rating / 10)
// Example: 1200 rating = 120 point range
```

#### 2. Expanding Search
- Every 20 seconds, search range multiplies
- Range 1 (0-20s): ±100-120 points
- Range 2 (20-40s): ±200-240 points
- Range 3 (40-60s): ±300-360 points

#### 3. Compatibility Score
```typescript
compatibilityScore = abs(player1Rating - player2Rating)
// Lower score = better match
```

#### 4. Match Type Restrictions

**Ranked Matches:**
- Maximum ELO difference: 200 points (expands with wait time)
- ELO changes affect player ratings
- More competitive matching

**Casual Matches:**
- Wider ELO range allowed
- No ELO changes
- Faster matching

### Matchmaking Flow

```
Player requests match
    ↓
Join lobby with ELO rating
    ↓
Search for opponents in ELO range
    ↓
Found? → Create match → Start game
    ↓ No
Wait in lobby (expanding search)
    ↓
Repeat search every few seconds
    ↓
Timeout after 60s → Remove from lobby
```

## API Endpoints

### POST /api/match/find
Join matchmaking and find a match.

**Request:**
```json
{
  "type": "RANKED" // or "CASUAL"
}
```

**Response (Matched):**
```json
{
  "status": "success",
  "data": {
    "matched": true,
    "match": {
      "id": "match-id",
      "type": "RANKED",
      "status": "IN_PROGRESS",
      "questions": [...],
      "participants": [...]
    }
  }
}
```

**Response (Waiting):**
```json
{
  "status": "success",
  "data": {
    "matched": false,
    "message": "Searching for opponent...",
    "lobbyStatus": {
      "totalPlayers": 5,
      "rankedPlayers": 3,
      "casualPlayers": 2
    }
  }
}
```

### GET /api/match/status
Check current matchmaking status.

**Query Parameters:**
- `type`: "RANKED" or "CASUAL"

**Response:**
```json
{
  "status": "success",
  "data": {
    "inLobby": true,
    "matched": false,
    "lobbyStatus": {...}
  }
}
```

### POST /api/match/leave
Leave the matchmaking lobby.

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Left matchmaking lobby"
  }
}
```

### GET /api/match/:matchId
Get details of a specific match.

**Response:**
```json
{
  "status": "success",
  "data": {
    "match": {
      "id": "match-id",
      "type": "RANKED",
      "status": "COMPLETED",
      "participants": [...],
      "results": [...]
    }
  }
}
```

### POST /api/match/submit
Submit match results.

**Request:**
```json
{
  "matchId": "match-id",
  "answers": {
    "question-id-1": "answer1",
    "question-id-2": "answer2"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "result": {
      "score": 80,
      "eloChange": 15
    }
  }
}
```

## Seeding the Database

The application includes comprehensive seed data with 31 language learning questions across multiple categories:

- Vocabulary (Spanish, French, German)
- Grammar (English, Spanish, French)
- Pronunciation
- Reading Comprehension
- Idioms and Expressions

**Run seed:**
```bash
cd backend
npm run prisma:seed
```

**What gets seeded:**
- 31 diverse language questions
- 5 sample users with varying ELO ratings
- Cleared existing matches and quiz data

## Best Practices

### For Developers

1. **Production Deployment**: Move lobby system from in-memory to Redis
2. **Monitoring**: Log matchmaking metrics (wait times, match quality)
3. **Balancing**: Adjust K-factor and search ranges based on player population
4. **Fair Play**: Implement anti-cheat measures for quiz submissions

### For Users

1. **Peak Hours**: Better matches during high-activity times
2. **Rating Stability**: Play more matches for accurate rating
3. **Ranked vs Casual**: Use casual to practice without rating pressure
4. **Patience**: Better matches come with slightly longer wait times

## Technical Details

### Files

- `backend/src/utils/elo.ts` - ELO calculation functions
- `backend/src/services/matchmakingService.ts` - Lobby and matching logic
- `backend/src/controllers/matchController.ts` - Match endpoints
- `backend/prisma/seed.ts` - Database seeding

### Database Schema

**Match Table:**
- `type`: RANKED | CASUAL
- `status`: WAITING | IN_PROGRESS | COMPLETED
- `questions`: JSON array of question data
- `participants`: Relation to User (many-to-many)

**MatchResult Table:**
- `matchId`, `userId`: Composite unique key
- `score`: Points earned
- `answers`: JSON of submitted answers
- `eloChange`: Rating change (null for casual)

## Future Enhancements

- Real-time matchmaking with WebSockets
- Team-based matches (2v2, 3v3)
- Tournament system
- Seasonal rankings and rewards
- Machine learning for optimal K-factor
- Anti-smurf detection
- Regional matchmaking
