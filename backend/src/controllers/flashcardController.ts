import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { AppError } from '../middleware/errorHandler';
import { cronService } from '../services/cronService';
import { Language } from '@prisma/client';

export const getFlashcards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      count = '20',
      category,
      language = 'SPANISH',
      source,
    } = req.query;

    const where: any = {
      isActive: true,
      language: language as Language,
    };

    if (category) {
      where.category = category as string;
    }

    if (source) {
      where.source = source as string;
    }

    // Get flashcards from database
    const flashcards = await prisma.flashcard.findMany({
      where,
      take: parseInt(count as string),
    });

    // Shuffle for variety
    const shuffled = flashcards.sort(() => Math.random() - 0.5);

    // Mix of 70% curated and 30% dynamic content
    const curated = shuffled.filter(f => f.source === 'CURATED');
    const dynamic = shuffled.filter(f => f.source !== 'CURATED');

    const curatedCount = Math.ceil(parseInt(count as string) * 0.7);
    const dynamicCount = parseInt(count as string) - curatedCount;

    const mixed = [
      ...curated.slice(0, curatedCount),
      ...dynamic.slice(0, dynamicCount),
    ].sort(() => Math.random() - 0.5);

    res.json({
      status: 'success',
      data: {
        flashcards: mixed.map(card => ({
          id: card.id,
          frontText: card.frontText,
          backText: card.backText,
          contextSentence: card.contextSentence,
          category: card.category,
          source: card.source,
          sourceTitle: card.sourceTitle,
          sourceUrl: card.sourceUrl,
          difficulty: card.difficulty,
          imageUrl: card.imageUrl,
        })),
        stats: {
          total: mixed.length,
          curated: mixed.filter(c => c.source === 'CURATED').length,
          dynamic: mixed.filter(c => c.source !== 'CURATED').length,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFlashcardCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language = 'SPANISH' } = req.query;

    // Get available categories
    const flashcards = await prisma.flashcard.findMany({
      where: {
        isActive: true,
        language: language as Language,
      },
      select: {
        category: true,
        source: true,
        difficulty: true,
      }
    });

    const categories = [...new Set(flashcards.map(f => f.category))];
    const sources = [...new Set(flashcards.map(f => f.source))];
    const difficulties = [...new Set(flashcards.map(f => f.difficulty))];

    // Count by category
    const categoryStats = categories.map(cat => ({
      category: cat,
      count: flashcards.filter(f => f.category === cat).length,
    }));

    res.json({
      status: 'success',
      data: {
        categories: categoryStats,
        sources,
        difficulties,
        totalFlashcards: flashcards.length,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Manual refresh endpoint (admin only)
export const refreshFlashcards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language = 'SPANISH' } = req.body;

    const count = await cronService.manualRefresh(language);

    res.json({
      status: 'success',
      message: `Successfully refreshed ${count} flashcards`,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

// Seed curated flashcards (admin only)
export const seedFlashcards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await cronService.seedCurated();

    res.json({
      status: 'success',
      message: `Successfully seeded ${count} curated flashcards`,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};
