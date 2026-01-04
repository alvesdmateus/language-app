import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDailyQuiz, submitDailyQuiz } from '../controllers/quizController';

const router = Router();

router.get('/daily', authenticate, getDailyQuiz);
router.post('/daily/submit', authenticate, submitDailyQuiz);

export default router;
