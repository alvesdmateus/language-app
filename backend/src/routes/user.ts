import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, getLeaderboard } from '../controllers/userController';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.get('/leaderboard', authenticate, getLeaderboard);

export default router;
