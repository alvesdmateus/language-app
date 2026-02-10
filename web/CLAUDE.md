# CLAUDE.md - Web Frontend

See root `../CLAUDE.md` for API endpoints, database models, WebSocket events, and design system.

## Overview

React + Vite + TypeScript web client replacing the removed React Native/Expo mobile app. This is a new build - no existing code yet.

## Architecture Guidance

### Recommended Stack
- **Framework**: React 18+ with Vite
- **Language**: TypeScript (strict)
- **Routing**: React Router v6+
- **HTTP**: Axios (matches backend patterns)
- **WebSocket**: socket.io-client v4.7+
- **State**: React Context (auth, WebSocket) + local state for components

### API Integration

Backend runs at `http://localhost:3000`. All authenticated requests need:
```
Authorization: Bearer <jwt-token>
```

Response shape: `{ status: "success"|"error", data?: {}, message?: "" }`

#### API Service Pattern (matching backend endpoints)
```typescript
const api = axios.create({ baseURL: 'http://localhost:3000/api' });

// Auth
api.post('/auth/login', { email, password })      // → { token, user }
api.post('/auth/register', { email, username, password })

// Users
api.get('/users/profile')                          // → { user, stats }
api.get('/users/leaderboard')
api.get('/users/leaderboard/division/:division')   // → division leaderboard
api.put('/users/favorite-language', { language })   // onboarding
api.put('/users/complete-onboarding')               // mark onboarding done

// Match
api.post('/match/find', { type, language, isBattleMode })
api.post('/match/submit', { matchId, answers })    // answers: { [questionId]: { answer, timeMs } }
api.post('/match/leave')
api.get('/match/status')
api.get('/match/:matchId')

// Language Stats
api.get('/language-stats')
api.get('/language-stats/:language')
api.get('/language-stats/:language/leaderboard')

// Quiz
api.get('/quiz/daily')
api.post('/quiz/daily/submit', { answers })

// Flashcards
api.get('/flashcards')
api.get('/flashcards/categories')
```

### Socket.IO Client Pattern

```typescript
import { io, Socket } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: jwtToken },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Matchmaking
socket.emit('matchmaking:join', { type: 'BATTLE', language: 'ENGLISH' });
socket.on('matchmaking:match_found', (data) => { /* navigate to game */ });
socket.on('matchmaking:lobby_update', (data) => { /* update player count */ });

// In-game
socket.emit('game:answer_submitted', { matchId, questionId });
socket.on('game:opponent_answered', (data) => { /* show opponent progress */ });
socket.on('match:completed', (data) => { /* show results */ });
```

## Design System Reference

### Colors
```css
--color-primary:  #4A90E2;  /* Blue - actions, links */
--color-success:  #34C759;  /* Green - correct, success */
--color-danger:   #FF3B30;  /* Red - errors, incorrect */
--color-warning:  #FF9500;  /* Orange - timer warnings */
--color-accent:   #5856D6;  /* Purple - accents */
--color-gold:     #FFD700;  /* Gold - achievements */
```

### Division Colors
```css
--div-unranked:     #808080;
--div-bronze:       #CD7F32;
--div-silver:       #C0C0C0;
--div-gold:         #FFD700;
--div-platinum:     #E5E4E2;
--div-diamond:      #B9F2FF;
--div-master:       #9B30FF;
--div-grandmaster:  #FF1493;
```

### Typography
- Headers: 24-32px bold
- Titles: 16-18px semibold (600)
- Body: 14-16px regular
- Captions: 12-13px regular

### Component Conventions
- Cards: white bg, 12px border-radius, subtle shadow
- Buttons: 12px border-radius, shadow, bold text
- Progress bars: 8px height, rounded caps
- Badges: 12px border-radius, colored backgrounds
- Timer feedback: green (>15s) -> orange (5-15s) -> red (<5s)

## Key Screens to Implement

```
Auth:       Login, Register
Home:       Main menu with battle modes, challenges, learning, stats
Battle:     Language selection → Matchmaking → Game → Results
Learn:      Daily quiz, Flashcards
Stats:      Language stats, Leaderboards, Achievements
Profile:    User profile, Settings
Onboarding: Welcome → Language pick → Tutorial → CPU battle → Celebration
```

## Game Screen Requirements

- Real-time countdown timer per question (visual: green → orange → red)
- Progress indicator (Question X of Y)
- Multiple choice (A/B/C/D) with selection feedback
- Track time per question in milliseconds (for tiebreaker scoring)
- Auto-submit on timeout
- Show opponent progress via WebSocket events
