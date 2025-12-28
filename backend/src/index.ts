import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import quizRoutes from './routes/quiz';
import matchRoutes from './routes/match';
import flashcardRoutes from './routes/flashcard';
import languageStatsRoutes from './routes/languageStats';
import { errorHandler } from './middleware/errorHandler';
import { socketService } from './services/socketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
socketService.initialize(httpServer);

// Middleware
app.use(helmet());
app.use(compression());

// CORS configuration - allow localhost and local network
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost on any port
    if (origin.match(/^http:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }

    // Allow local network IPs (192.168.0.*)
    if (origin.match(/^http:\/\/192\.168\.0\.\d+(:\d+)?$/)) {
      return callback(null, true);
    }

    // Allow specific CORS_ORIGIN from env if set
    if (process.env.CORS_ORIGIN === '*' || origin === process.env.CORS_ORIGIN) {
      return callback(null, true);
    }

    callback(null, true); // Allow all in development
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    websocket: {
      connected: socketService.getConnectedUsersCount(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/language-stats', languageStatsRoutes);

// Error handling
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server ready`);
});

export default app;
