# Language Learning App

A full-stack mobile application focused on language learning through daily practice. Users can complete daily quizzes and compete in ranked or casual matchmaking.

## Features

### Learning & Practice
- Daily Quiz: Complete a new quiz every day to maintain your learning streak
- Flashcard Learning: Study with interactive flashcards featuring card-flipping animations and progress tracking
- 8 Supported Languages: Portuguese, Spanish, English, Italian, French, German, Japanese, Korean

### Competitive Game Modes
- **Battle Mode**: Intense 5-question matches with 45s per question, ELO-based difficulty
- **Ranked Mode**: Compete for language-specific ELO ratings
- **Casual Mode**: Practice without affecting your rating
- **Custom Lobbies**: Configure match settings (duration, difficulty, power-ups)

### Progression System
- Multi-Language ELO: Separate rating for each of 8 languages
- Division System: 8 divisions from Unranked to Grandmaster with tier progression
- Language-Specific Stats: Track wins, losses, draws per language
- Leaderboards: Language-specific rankings

### Match Features
- Smart Winner Determination: Accuracy → Speed → Draw
- ELO-Based Difficulty: Questions adapt to player skill level
  - Beginner: Easy only
  - Mid-ladder: Easy to Medium
  - High-ELO: Medium to Hard
  - Top percent: Hard only
- Real-Time Updates: WebSocket-powered live match notifications
- Timing Tracking: Precise answer timing for tiebreakers

### Technical Features
- JWT Authentication: Secure user authentication and authorization
- Fair Matchmaking: Language and ELO-based opponent matching
- Real-Time WebSockets: Live match updates and notifications

For detailed information:
- Game Logic: [backend/GAME_LOGIC.md](./backend/GAME_LOGIC.md)
- Matchmaking System: [MATCHMAKING.md](./MATCHMAKING.md)
- Division System: [DIVISIONS.md](./DIVISIONS.md)
- WebSocket Features: [WEBSOCKETS.md](./WEBSOCKETS.md)

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- Prisma ORM
- JWT authentication
- Docker support

### Mobile
- React Native with Expo
- TypeScript
- React Navigation
- Axios for API calls
- AsyncStorage for local data

## Project Structure

```
language-app/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/        # Database schema
│   └── package.json
├── mobile/            # React Native app
│   ├── src/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── context/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Expo CLI (for mobile development)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database with sample questions and users:
```bash
npm run prisma:seed
```

7. Start the development server:
```bash
npm run dev
```

The backend will be available at `http://localhost:3000`

### Mobile Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Use Expo Go app on your phone or an emulator to run the app

### Docker Setup

To run the entire stack with Docker:

```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile (authenticated)
- `GET /api/users/leaderboard` - Get leaderboard

### Quiz
- `GET /api/quiz/daily` - Get daily quiz (authenticated)
- `POST /api/quiz/daily/submit` - Submit daily quiz answers (authenticated)

### Match
- `POST /api/match/find` - Find a match (authenticated)
- `POST /api/match/leave` - Leave matchmaking lobby (authenticated)
- `POST /api/match/submit` - Submit match results (authenticated)
- `GET /api/match/:matchId` - Get match details (authenticated)
- `GET /api/match/status` - Check matchmaking status (authenticated)

### Language Statistics
- `GET /api/language-stats` - Get all language stats for user (authenticated)
- `GET /api/language-stats/:language` - Get stats for specific language (authenticated)
- `GET /api/language-stats/:language/leaderboard` - Get language leaderboard (authenticated)
- `GET /api/language-stats/:language/history` - Get match history for language (authenticated)

### Flashcards
- `GET /api/flashcards` - Get flashcards for studying (authenticated)
- `GET /api/flashcards/categories` - Get available question types and difficulties (authenticated)

## Database Schema

The application uses the following main models:

- **User**: User accounts with authentication and statistics
- **LanguageStats**: Per-language ELO ratings and match statistics (8 languages)
- **DailyQuiz**: Daily quiz questions and metadata
- **DailyQuizCompletion**: User quiz completions and scores
- **Match**: Matchmaking sessions (ranked/casual/battle/custom) with language and settings
- **MatchResult**: Individual match results with timing data and ELO changes
- **Question**: Question bank with language and difficulty categorization

## Development

### Running Prisma Studio

To view and edit database records:

```bash
cd backend
npm run prisma:studio
```

### Database Migrations

After pulling the latest game logic changes, run:

```bash
cd backend
npx prisma migrate dev --name add_game_logic
npx prisma generate
```

Or create a new migration:

```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/language_app
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:19006
```

## Game Modes Guide

### Battle Mode
- 5 questions, 45 seconds each
- ELO-based automatic difficulty
- Affects language-specific rating
- Fast-paced competitive gameplay

### Custom Lobby
- Configure match settings:
  - Question duration: 30, 45, or 60 seconds
  - Difficulty: Easy, Medium, or Hard
  - Power-ups: Enabled or disabled
- 10 questions per match
- Practice mode (no ELO changes)

### Ranked Mode
- Competitive play with ELO changes
- 10 questions per match
- ELO-based difficulty matching
- Language-specific rankings

### Casual Mode
- Relaxed gameplay
- No rating changes
- 10 questions per match
- Mixed difficulty

## Future Enhancements

- Power-up system implementation (UI/mechanics)
- Team battles (2v2, 3v3)
- Tournament mode
- Voice recognition for pronunciation practice
- Social features (friends, chat)
- Achievement system
- Push notifications for daily reminders
- Seasonal rankings and rewards

## License

ISC
