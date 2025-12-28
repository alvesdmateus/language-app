import cron from 'node-cron';
import { flashcardGenerationService } from './flashcardGenerationService';
import { Language } from '@prisma/client';

export class CronService {
  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('🕐 Starting cron jobs...');

    // Refresh trending flashcards every Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      console.log('🔄 Running weekly flashcard refresh...');
      try {
        const count = await flashcardGenerationService.refreshTrendingFlashcards(Language.SPANISH);
        console.log(`✅ Weekly refresh completed: ${count} cards created`);
      } catch (error) {
        console.error('❌ Weekly refresh failed:', error);
      }
    });

    // Optional: Daily refresh for more frequent updates (runs at 3 AM daily)
    cron.schedule('0 3 * * *', async () => {
      console.log('🔄 Running daily flashcard refresh...');
      try {
        // Refresh with smaller batch
        const count = await flashcardGenerationService.refreshTrendingFlashcards(Language.SPANISH);
        console.log(`✅ Daily refresh completed: ${count} cards created`);
      } catch (error) {
        console.error('❌ Daily refresh failed:', error);
      }
    });

    console.log('✅ Cron jobs started successfully');
  }

  /**
   * Manually trigger flashcard refresh (useful for testing)
   */
  async manualRefresh(language: Language = Language.SPANISH): Promise<number> {
    console.log(`🔄 Manual refresh triggered for ${language}`);
    try {
      const count = await flashcardGenerationService.refreshTrendingFlashcards(language);
      console.log(`✅ Manual refresh completed: ${count} cards created`);
      return count;
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      throw error;
    }
  }

  /**
   * Seed initial curated content
   */
  async seedCurated(): Promise<number> {
    console.log('🌱 Seeding curated flashcards...');
    try {
      const count = await flashcardGenerationService.seedCuratedFlashcards();
      console.log(`✅ Seeding completed: ${count} curated cards created`);
      return count;
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }
}

export const cronService = new CronService();
