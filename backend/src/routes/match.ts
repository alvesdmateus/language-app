import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { findMatch, submitMatchResult } from '../controllers/matchController';

const router = Router();

router.post('/find', authenticate, findMatch);
router.post('/submit', authenticate, submitMatchResult);

export default router;
