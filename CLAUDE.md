# CLAUDE.md - Language Learning App

## Project Overview

Competitive language learning app where users complete daily quizzes and compete in real-time ELO-rated matches across 8 languages. Backend API is production-ready; mobile client (React Native/Expo) has been removed in favor of an upcoming web client (React + Vite).

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.IO (WebSocket with long-polling fallback)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Security**: helmet, cors, compression
- **Web (planned)**: React + Vite + TypeScript

## Directory Structure

```
language-app/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express + HTTP server + Socket.IO init
│   │   ├── controllers/          # Route handlers (req/res/next pattern)
│   │   ├── routes/               # Express Router definitions
│   │   ├── services/             # Business logic (class-based singletons)
│   │   ├── middleware/           # auth, errorHandler
│   │   ├── utils/                # elo, division, db, auth helpers
│   │   └── scripts/              # Seed and maintenance scripts
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (source of truth)
│   │   └── seed.ts               # Seeds questions + sample users
│   └── package.json
├── web/                          # React + Vite frontend (to be built)
├── docker-compose.yml            # PostgreSQL + backend
├── DIVISIONS.md                  # Division system details
├── MATCHMAKING.md                # ELO and matchmaking algorithms
├── WEBSOCKETS.md                 # Socket.IO events and architecture
├── IMPLEMENTATION_SUMMARY.md     # Feature implementation overview
└── backend/GAME_LOGIC.md         # Game modes and winner determination
```

## API Endpoints

All authenticated routes use `Authorization: Bearer <jwt-token>`. Responses follow `{ status: "success"|"error", data?: {}, message?: "" }`.

### Auth (`/api/auth`)
| Method | Path       | Auth | Description          |
|--------|-----------|------|----------------------|
| POST   | /register | No   | Create account       |
| POST   | /login    | No   | Get JWT token        |

### Users (`/api/users`)
| Method | Path                              | Auth | Description                |
|--------|----------------------------------|------|----------------------------|
| GET    | /profile                          | Yes  | User profile + stats       |
| GET    | /leaderboard                      | Yes  | Global leaderboard         |
| GET    | /leaderboard/division/:division   | Yes  | Division-specific board     |
| PUT    | /favorite-language                | Yes  | Set favorite language       |
| PUT    | /complete-onboarding              | Yes  | Mark onboarding done        |

### Quiz (`/api/quiz`)
| Method | Path           | Auth | Description            |
|--------|---------------|------|------------------------|
| GET    | /daily         | Yes  | Get today's quiz       |
| POST   | /daily/submit  | Yes  | Submit quiz answers    |

### Match (`/api/match`)
| Method | Path           | Auth | Description                    |
|--------|---------------|------|--------------------------------|
| POST   | /find          | Yes  | Join matchmaking lobby         |
| POST   | /leave         | Yes  | Leave matchmaking lobby        |
| POST   | /submit        | Yes  | Submit match answers + timing  |
| GET    | /status        | Yes  | Check matchmaking status       |
| GET    | /user/matches  | Yes  | List user's matches            |
| GET    | /:matchId      | Yes  | Get match details              |
| POST   | /cpu           | Yes  | Create CPU match (onboarding)  |
| POST   | /cpu/submit    | Yes  | Submit CPU match result        |

### Language Stats (`/api/language-stats`)
| Method | Path                      | Auth | Description              |
|--------|--------------------------|------|--------------------------|
| GET    | /                         | Yes  | All language stats       |
| GET    | /:language                | Yes  | Stats for one language   |
| GET    | /:language/leaderboard    | Yes  | Language leaderboard     |
| GET    | /:language/history        | Yes  | Match history            |

### Flashcards (`/api/flashcards`)
| Method | Path         | Auth | Description              |
|--------|-------------|------|--------------------------|
| GET    | /            | Yes  | Get flashcards           |
| GET    | /categories  | Yes  | Available categories     |

### Health
`GET /health` - Returns status, timestamp, and WebSocket connected count.

## Database Models (Prisma)

### Enums
```
Division:           UNRANKED | BRONZE | SILVER | GOLD | PLATINUM | DIAMOND | MASTER | GRANDMASTER
Language:           PORTUGUESE | SPANISH | ENGLISH | ITALIAN | FRENCH | GERMAN | JAPANESE | KOREAN
QuestionDifficulty: EASY | MEDIUM | HARD
MatchType:          RANKED | CASUAL | CUSTOM | BATTLE
MatchStatus:        WAITING | READY_CHECK | IN_PROGRESS | COMPLETED | CANCELLED
PowerUpType:        NONE | FREEZE | BURN
```

### Key Models
- **User** - Auth + profile + onboarding state. Has deprecated top-level `eloRating`/`division` (use `languageStats` instead).
- **LanguageStats** - Per-language ELO, division, wins/losses/draws. Composite unique: `[userId, language]`.
- **Match** - Game session with type, status, language, questions (JSON), custom settings. Supports CPU matches (`isCPUMatch`), async mode, power-ups.
- **MatchResult** - Per-player result: score, correctAnswers, totalTimeMs, answers (JSON with per-question `{ answer, timeMs, correct }`), eloChange.
- **Question** - Question bank: type ("grammar"/"comprehension"), difficulty, language, 4 options, correctAnswer.
- **Flashcard** - Study cards with category, source, frontText/backText, contextSentence.
- **DailyQuiz** / **DailyQuizCompletion** - Daily quiz system with scores.

## Division System

8 divisions with ELO ranges and 4 tiers each (IV-I):

| Division     | ELO Range  | Color     |
|-------------|------------|-----------|
| Unranked    | 0-799      | `#808080` |
| Bronze      | 800-1099   | `#CD7F32` |
| Silver      | 1100-1399  | `#C0C0C0` |
| Gold        | 1400-1699  | `#FFD700` |
| Platinum    | 1700-1999  | `#E5E4E2` |
| Diamond     | 2000-2299  | `#B9F2FF` |
| Master      | 2300-2599  | `#9B30FF` |
| Grandmaster | 2600+      | `#FF1493` |

New users start at 1000 ELO (Bronze IV). Division logic: `backend/src/utils/division.ts`.

## ELO System

- **K-Factor**: 32
- **Formula**: `newRating = currentRating + K * (actualScore - expectedScore)`
- **Expected score**: `1 / (1 + 10^((opponentRating - playerRating) / 400))`
- ELO is per-language via `LanguageStats` model
- ELO logic: `backend/src/utils/elo.ts`

## Game Modes

| Mode     | Questions | Timer | Difficulty       | ELO Changes |
|----------|-----------|-------|------------------|-------------|
| Battle   | 5         | 45s   | ELO-based auto   | Yes         |
| Ranked   | 10        | -     | ELO-based        | Yes         |
| Casual   | 10        | -     | Mixed            | No          |
| Custom   | 10        | 30/45/60s | User-selected | No          |

### ELO-Based Difficulty Mapping
```
< 1100 ELO:        EASY only
1100-1699 ELO:     EASY + MEDIUM
1700-2299 ELO:     MEDIUM + HARD
>= 2300 ELO:       HARD only
```

### Winner Determination (3-tier)
1. Most correct answers wins
2. Tie-break: fastest total time (ms) wins
3. Still tied: draw

## Matchmaking

- In-memory lobby (Map-based, not Redis yet)
- Search range: `baseRange = max(100, rating / 10)`, expands every 20s (up to 3x)
- Criteria: same match type + same language + similar ELO
- 60-second timeout auto-removes from lobby
- Logic: `backend/src/services/matchmakingService.ts`

## WebSocket Events

Connection requires JWT: `io({ auth: { token } })`. Users auto-join `user:{userId}` room.

### Client -> Server
| Event                    | Payload                                       |
|--------------------------|-----------------------------------------------|
| `matchmaking:join`       | `{ type, language }`                          |
| `matchmaking:leave`      | -                                              |
| `game:join_match`        | `{ matchId }`                                  |
| `game:answer_submitted`  | `{ matchId, questionId }`                      |
| `game:leave_match`       | `{ matchId }`                                  |
| `ping`                   | -                                              |

### Server -> Client
| Event                       | Payload                                       |
|-----------------------------|-----------------------------------------------|
| `matchmaking:joined`        | `{ matchType, lobbyStatus }`                  |
| `matchmaking:left`          | `{ matchType }`                               |
| `matchmaking:lobby_update`  | `{ lobbyStatus }`                             |
| `matchmaking:match_found`   | `{ matchId, participants, questions, ... }`   |
| `game:opponent_answered`    | `{ questionId }`                              |
| `match:completed`           | `{ matchId, winnerId, isDraw, results, eloChanges, divisionChanges }` |
| `pong`                      | -                                              |

## Design System

### Colors
| Name    | Hex       | Usage                        |
|---------|-----------|------------------------------|
| Blue    | `#4A90E2` | Primary actions, links       |
| Green   | `#34C759` | Success, correct answers     |
| Red     | `#FF3B30` | Errors, incorrect, danger    |
| Orange  | `#FF9500` | Warnings, timer alerts       |
| Purple  | `#5856D6` | Accents, special elements    |
| Gold    | `#FFD700` | Gold division, achievements  |

### Typography
- Headers: 24-32px bold
- Titles: 16-18px semibold
- Body: 14-16px regular
- Captions: 12-13px regular

### Component Patterns
- Cards: white bg, 12px border-radius, shadow
- Buttons: 12px border-radius, shadow, bold text
- Progress bars: 8px height, rounded
- Badges: 12px border-radius, colored backgrounds

## Development Commands

```bash
# Backend
cd backend
npm run dev              # Start with nodemon (port 3000)
npm run build            # TypeScript compile
npm start                # Run compiled JS
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # DB GUI (port 5555)
npm run prisma:seed      # Seed questions + users

# Docker
docker-compose up        # PostgreSQL (5432) + backend (3000)
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/language_app
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:19006
```

## Key Patterns

- **Response format**: All endpoints return `{ status: "success"|"error", data?: {}, message?: "" }`
- **Error handling**: Throw `AppError(message, statusCode)` in controllers; global `errorHandler` middleware catches them
- **Auth**: `authenticate` middleware extracts `req.userId` from JWT; use `AuthRequest` type
- **Services**: Business logic in singleton class instances exported from service files (e.g., `export const gameService = new GameService()`)
- **Prisma**: Single client in `utils/db.ts`; import as `import prisma from '../utils/db'`
- **Routes**: `Router()` + `authenticate` middleware + controller function; routes mounted in `index.ts`
- **Onboarding**: CPU matches (`isCPUMatch`) for first-battle experience; `user.onboardingCompleted` flag
- **Mobile removed**: The `mobile/` directory has been deleted; web client will replace it
