import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getFlashcards, getFlashcardCategories } from '../controllers/flashcardController';

const router = Router();

router.get('/', authenticate, getFlashcards);
router.get('/categories', authenticate, getFlashcardCategories);

export default router;
