import prisma from '../utils/db';
import { contentFetchService } from './contentFetchService';
import { Language, FlashcardCategory, ContentSource, QuestionDifficulty } from '@prisma/client';

// Simple translation dictionary for common words
// In production, you'd use a translation API like Google Translate, DeepL, or LibreTranslate
const TRANSLATIONS: Record<string, Record<string, string>> = {
  SPANISH: {
    'technology': 'tecnología',
    'sports': 'deportes',
    'business': 'negocios',
    'science': 'ciencia',
    'entertainment': 'entretenimiento',
    'movie': 'película',
    'music': 'música',
    'game': 'juego',
    'news': 'noticias',
  },
  PORTUGUESE: {
    'technology': 'tecnologia',
    'sports': 'esportes',
    'business': 'negócios',
    'science': 'ciência',
    'entertainment': 'entretenimento',
    'movie': 'filme',
    'music': 'música',
    'game': 'jogo',
    'news': 'notícias',
  },
  FRENCH: {
    'technology': 'technologie',
    'sports': 'sports',
    'business': 'affaires',
    'science': 'science',
    'entertainment': 'divertissement',
    'movie': 'film',
    'music': 'musique',
    'game': 'jeu',
    'news': 'nouvelles',
  },
};

interface FlashcardData {
  language: Language;
  category: FlashcardCategory;
  frontText: string;
  backText: string;
  contextSentence: string;
  sourceUrl: string;
  sourceTitle: string;
  difficulty: QuestionDifficulty;
  expiresAt: Date;
}

export class FlashcardGenerationService {
  /**
   * Get translation for a word
   * In production, integrate with a translation API
   */
  private async translateWord(word: string, targetLanguage: Language): Promise<string> {
    // Check our simple dictionary first
    const translations = TRANSLATIONS[targetLanguage.toString()] || {};
    if (translations[word.toLowerCase()]) {
      return translations[word.toLowerCase()];
    }

    // For now, return a placeholder
    // TODO: Integrate with translation API (Google Translate, DeepL, LibreTranslate)
    return `[${word}]`; // Placeholder showing it needs translation
  }

  /**
   * Extract a sentence containing a specific word from text
   */
  private extractSentenceWithWord(text: string, word: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(word.toLowerCase())) {
        return sentence.trim();
      }
    }

    return `Example: ${word}`;
  }

  /**
   * Determine difficulty based on word length and complexity
   */
  private determineDifficulty(word: string): QuestionDifficulty {
    if (word.length <= 5) return QuestionDifficulty.EASY;
    if (word.length <= 8) return QuestionDifficulty.MEDIUM;
    return QuestionDifficulty.HARD;
  }

  /**
   * Map news category to flashcard category
   */
  private mapCategory(newsCategory: string): FlashcardCategory {
    const mapping: Record<string, FlashcardCategory> = {
      'entertainment': FlashcardCategory.ENTERTAINMENT,
      'sports': FlashcardCategory.SPORTS,
      'technology': FlashcardCategory.TECHNOLOGY,
      'business': FlashcardCategory.BUSINESS,
      'science': FlashcardCategory.SCIENCE,
      'general': FlashcardCategory.GENERAL,
    };

    return mapping[newsCategory.toLowerCase()] || FlashcardCategory.GENERAL;
  }

  /**
   * Generate flashcards from a news article
   */
  async generateFlashcardsFromArticle(
    article: any,
    language: Language,
    category: string,
    maxCards: number = 5
  ): Promise<FlashcardData[]> {
    const fullText = `${article.title} ${article.description || ''} ${article.content || ''}`;
    const vocabulary = contentFetchService.extractVocabulary(fullText);

    const flashcards: FlashcardData[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    for (const word of vocabulary.slice(0, maxCards)) {
      const translation = await this.translateWord(word, language);
      const contextSentence = this.extractSentenceWithWord(fullText, word);

      flashcards.push({
        language,
        category: this.mapCategory(category),
        frontText: word,
        backText: translation,
        contextSentence: contextSentence.substring(0, 200), // Limit length
        sourceUrl: article.url,
        sourceTitle: article.title,
        difficulty: this.determineDifficulty(word),
        expiresAt,
      });
    }

    return flashcards;
  }

  /**
   * Refresh all flashcards from trending content
   */
  async refreshTrendingFlashcards(language: Language = Language.SPANISH): Promise<number> {
    try {
      // Deactivate old NEWS_API flashcards
      await prisma.flashcard.updateMany({
        where: {
          source: ContentSource.NEWS_API,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Fetch trending content
      const contentMap = await contentFetchService.getAllTrendingContent();
      let totalCreated = 0;

      for (const [category, articles] of contentMap.entries()) {
        for (const article of articles.slice(0, 2)) { // 2 articles per category
          const flashcardData = await this.generateFlashcardsFromArticle(
            article,
            language,
            category,
            3 // 3 words per article
          );

          // Save flashcards to database
          for (const data of flashcardData) {
            await prisma.flashcard.create({
              data: {
                ...data,
                source: ContentSource.NEWS_API,
              },
            });
            totalCreated++;
          }
        }
      }

      console.log(`✅ Created ${totalCreated} new flashcards from trending content`);
      return totalCreated;
    } catch (error) {
      console.error('Error refreshing flashcards:', error);
      throw error;
    }
  }

  /**
   * Seed initial curated flashcards
   */
  async seedCuratedFlashcards(): Promise<number> {
    const curatedCards: Array<{
      category: FlashcardCategory;
      frontText: string;
      backText: string;
      contextSentence: string;
      language: Language;
    }> = [
      // Movies & TV
      { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: 'éxito de taquilla', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.SPANISH },
      { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: 'secuela', contextSentence: 'The sequel was even better than the original.', language: Language.SPANISH },
      { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: 'maratonear', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.SPANISH },

      // Sports
      { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: 'campeonato', contextSentence: 'They won the championship last year.', language: Language.SPANISH },
      { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'torneo', contextSentence: 'The tennis tournament starts next week.', language: Language.SPANISH },

      // Technology
      { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'teléfono inteligente', contextSentence: 'My smartphone battery lasts all day.', language: Language.SPANISH },
      { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'algoritmo', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.SPANISH },

      // Music
      { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'lista de reproducción', contextSentence: 'I created a new playlist for working out.', language: Language.SPANISH },
      { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'transmisión', contextSentence: 'Music streaming has changed the industry.', language: Language.SPANISH },

      // Food
      { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'receta', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.SPANISH },
      { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: 'ingrediente', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.SPANISH },

      // Gaming
      { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'multijugador', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.SPANISH },
      { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: 'logro', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.SPANISH },
    ];

    let created = 0;
    for (const card of curatedCards) {
      const exists = await prisma.flashcard.findFirst({
        where: {
          frontText: card.frontText,
          language: card.language,
        },
      });

      if (!exists) {
        await prisma.flashcard.create({
          data: {
            ...card,
            source: ContentSource.CURATED,
            difficulty: QuestionDifficulty.MEDIUM,
          },
        });
        created++;
      }
    }

    console.log(`✅ Seeded ${created} curated flashcards`);
    return created;
  }
}

export const flashcardGenerationService = new FlashcardGenerationService();
