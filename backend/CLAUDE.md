# CLAUDE.md - Backend

See root `../CLAUDE.md` for API endpoints, database models, WebSocket events, and design system.

## Architecture

```
src/
├── index.ts                          # App entry: Express + HTTP server + Socket.IO init
├── controllers/                      # Request handlers (req: AuthRequest, res, next)
│   ├── authController.ts             # register, login
│   ├── userController.ts             # profile, leaderboard, onboarding
│   ├── matchController.ts            # findMatch, submitMatchResult, CPU matches
│   ├── quizController.ts             # daily quiz
│   ├── languageStatsController.ts    # per-language stats, leaderboards, history
│   └── flashcardController.ts        # flashcard queries
├── routes/                           # Router definitions: Router() + authenticate + handler
│   ├── auth.ts                       # /api/auth/*
│   ├── user.ts                       # /api/users/*
│   ├── match.ts                      # /api/match/*
│   ├── quiz.ts                       # /api/quiz/*
│   ├── languageStats.ts              # /api/language-stats/*
│   └── flashcard.ts                  # /api/flashcards/*
├── services/                         # Business logic (class-based singletons)
│   ├── gameService.ts                # Question selection, answer processing, winner determination, ELO-based difficulty
│   ├── matchmakingService.ts         # In-memory lobby, opponent matching, match creation
│   ├── socketService.ts              # Socket.IO server, auth, rooms, event emission
│   ├── userService.ts                # ELO updates, division recalculation
│   ├── powerUpService.ts             # Power-up mechanics (FREEZE/BURN)
│   ├── cpuOpponentService.ts         # CPU matches for onboarding first battle
│   ├── cronService.ts                # Scheduled tasks
│   ├── flashcardGenerationService.ts # Flashcard content generation
│   └── contentFetchService.ts        # External content fetching
├── middleware/
│   ├── auth.ts                       # JWT verification → req.userId; exports AuthRequest type
│   └── errorHandler.ts               # AppError class + global error handler
├── utils/
│   ├── db.ts                         # Prisma client singleton
│   ├── elo.ts                        # ELO calculation (K=32), matchmaking range
│   ├── division.ts                   # Division from ELO, tiers, progress
│   └── auth.ts                       # Auth helper utilities
└── scripts/
    ├── seedFlashcards.ts             # Flashcard seeding
    ├── seedAllLanguages.ts           # Multi-language question seeding
    ├── checkUserElos.ts              # ELO audit script
    ├── recalculateDivisions.ts       # Bulk division recalculation
    └── testDivisions.ts              # Division logic verification
```

## Controller Pattern

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';

export const handlerName = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;  // Set by authenticate middleware
    // ... business logic, delegate to services ...
    res.json({ status: 'success', data: { /* ... */ } });
  } catch (error) {
    next(error);  // Caught by errorHandler middleware
  }
};
```

## Error Handling

- `throw new AppError(message, statusCode)` for expected errors (400, 401, 403, 404, 409)
- Unhandled errors become 500 with generic message
- Always pass errors to `next(error)`, never send raw responses for errors

## Prisma Usage

```typescript
import prisma from '../utils/db';

// Composite unique lookup
const stats = await prisma.languageStats.findUnique({
  where: { userId_language: { userId, language } }
});

// Include relations with field selection
const match = await prisma.match.findUnique({
  where: { id: matchId },
  include: {
    participants: { select: { id: true, username: true, displayName: true, eloRating: true } },
    results: { include: { user: { select: { id: true, username: true } } } }
  }
});

// Atomic increment
await prisma.languageStats.update({
  where: { userId_language: { userId, language } },
  data: { totalMatches: { increment: 1 }, wins: result === 'win' ? { increment: 1 } : undefined }
});
```

## Key Services

### gameService (`services/gameService.ts`)
- `getDifficultyFromElo(elo)` - Maps ELO to allowed difficulty levels
- `selectQuestions(options)` - Picks random questions by language + difficulty
- `processAnswers(matchId, userId, answers)` - Validates answers, calculates score (10pts/correct)
- `determineWinner(results[])` - 3-tier: accuracy > speed > draw
- `getOrCreateLanguageStats(userId, language)` - Upsert pattern for LanguageStats
- `updateLanguageStats(userId, language, eloChange, result)` - Updates ELO, division, win/loss/draw

### matchmakingService (`services/matchmakingService.ts`)
- `joinLobby(userId, type, language, options)` - Add to in-memory Map lobby
- `findMatch(userId, type)` - Search for ELO-compatible opponent
- `createMatch(userId, opponentId, type)` - Create Match record + select questions
- `leaveLobby(userId)` - Remove from lobby
- `cleanupMatch(matchId)` - Post-match cleanup
- Lobby uses `Map<string, LobbyEntry>` (not persisted, not Redis)

### socketService (`services/socketService.ts`)
- `initialize(httpServer)` - Sets up Socket.IO with JWT auth middleware
- `emitToUser(userId, event, data)` - Emit to `user:{userId}` room
- `emitToUsers(userIds[], event, data)` - Emit to multiple users
- `emitToMatchmaking(type, event, data)` - Emit to matchmaking room
- `broadcast(event, data)` - Emit to all connected clients
- `getConnectedUsersCount()` - Active connection count

### cpuOpponentService (`services/cpuOpponentService.ts`)
- `createCPUMatch(userId, language)` - Creates a match with CPU opponent for onboarding
- `completeCPUMatch(matchId, userId, answers)` - Processes result against CPU score
- `isCPUMatch(matchId)` - Check if match is CPU-based
