import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getFlashcards,
  getFlashcardCategories,
  refreshFlashcards,
  seedFlashcards
} from '../controllers/flashcardController';

const router = Router();

router.get('/', authenticate, getFlashcards);
router.get('/categories', authenticate, getFlashcardCategories);
router.post('/refresh', authenticate, refreshFlashcards);
router.post('/seed', authenticate, seedFlashcards);

export default router;
