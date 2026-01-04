import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllLanguageStats,
  getLanguageStats,
  getLeaderboard,
  getMatchHistory,
} from '../controllers/languageStatsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all language stats for the authenticated user
router.get('/', getAllLanguageStats);

// Get stats for a specific language
router.get('/:language', getLanguageStats);

// Get leaderboard for a specific language
router.get('/:language/leaderboard', getLeaderboard);

// Get match history for a specific language
router.get('/:language/history', getMatchHistory);

export default router;
