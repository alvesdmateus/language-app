import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  findMatch,
  submitMatchResult,
  leaveLobby,
  checkMatchStatus,
  getMatch,
  getUserMatches,
  createCPUMatch,
  submitCPUMatchResult,
} from '../controllers/matchController';

const router = Router();

router.post('/find', authenticate, findMatch);
router.post('/leave', authenticate, leaveLobby);
router.get('/status', authenticate, checkMatchStatus);
router.get('/user/matches', authenticate, getUserMatches);
router.get('/:matchId', authenticate, getMatch);
router.post('/submit', authenticate, submitMatchResult);

// CPU match routes (for onboarding)
router.post('/cpu', authenticate, createCPUMatch);
router.post('/cpu/submit', authenticate, submitCPUMatchResult);

export default router;
