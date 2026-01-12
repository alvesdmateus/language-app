import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProfile,
  getLeaderboard,
  getDivisionLeaderboard,
  updateFavoriteLanguage,
  completeOnboarding,
} from '../controllers/userController';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/leaderboard/division/:division', authenticate, getDivisionLeaderboard);

// Onboarding routes
router.put('/favorite-language', authenticate, updateFavoriteLanguage);
router.put('/complete-onboarding', authenticate, completeOnboarding);

export default router;
