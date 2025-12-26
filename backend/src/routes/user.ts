import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, getLeaderboard, getDivisionLeaderboard } from '../controllers/userController';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/leaderboard/division/:division', authenticate, getDivisionLeaderboard);

export default router;
