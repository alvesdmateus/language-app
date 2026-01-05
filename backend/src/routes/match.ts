import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  findMatch,
  submitMatchResult,
  leaveLobby,
  checkMatchStatus,
  getMatch,
  getUserMatches,
} from '../controllers/matchController';

const router = Router();

router.post('/find', authenticate, findMatch);
router.post('/leave', authenticate, leaveLobby);
router.get('/status', authenticate, checkMatchStatus);
router.get('/user/matches', authenticate, getUserMatches);
router.get('/:matchId', authenticate, getMatch);
router.post('/submit', authenticate, submitMatchResult);

export default router;
