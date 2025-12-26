# Language Learning App

A full-stack mobile application focused on language learning through daily practice. Users can complete daily quizzes and compete in ranked or casual matchmaking.

## Features

- Daily Quiz: Complete a new quiz every day to maintain your learning streak
- Ranked Matchmaking: Compete against other players for ELO rating
- Casual Matchmaking: Practice without affecting your rating
- Leaderboard: See top players and track your progress
- User Profiles: Track streaks, points, and statistics
- JWT Authentication: Secure user authentication and authorization

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

6. Start the development server:
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
- `POST /api/match/submit` - Submit match results (authenticated)

## Database Schema

The application uses the following main models:

- **User**: User accounts with authentication and statistics
- **DailyQuiz**: Daily quiz questions and metadata
- **DailyQuizCompletion**: User quiz completions and scores
- **Match**: Matchmaking sessions (ranked/casual)
- **MatchResult**: Individual match results and ELO changes
- **Question**: Question bank for quizzes and matches

## Development

### Running Prisma Studio

To view and edit database records:

```bash
cd backend
npm run prisma:studio
```

### Database Migrations

Create a new migration:

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

## Future Enhancements

- Real-time matchmaking with WebSockets
- Multiple language support
- Voice recognition for pronunciation practice
- Social features (friends, chat)
- Achievement system
- Push notifications for daily reminders

## License

ISC
