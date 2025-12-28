import axios from 'axios';

// NewsAPI configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'your-api-key-here';
const NEWS_API_URL = 'https://newsapi.org/v2';

interface Article {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface CategoryMapping {
  newsCategory: string;
  flashcardCategory: string;
}

const CATEGORY_MAPPINGS: CategoryMapping[] = [
  { newsCategory: 'entertainment', flashcardCategory: 'ENTERTAINMENT' },
  { newsCategory: 'sports', flashcardCategory: 'SPORTS' },
  { newsCategory: 'technology', flashcardCategory: 'TECHNOLOGY' },
  { newsCategory: 'business', flashcardCategory: 'BUSINESS' },
  { newsCategory: 'science', flashcardCategory: 'SCIENCE' },
  { newsCategory: 'general', flashcardCategory: 'GENERAL' },
];

export class ContentFetchService {
  /**
   * Fetch trending articles from NewsAPI
   */
  async fetchTrendingArticles(
    category: string = 'general',
    language: string = 'en',
    pageSize: number = 10
  ): Promise<Article[]> {
    try {
      const response = await axios.get(`${NEWS_API_URL}/top-headlines`, {
        params: {
          apiKey: NEWS_API_KEY,
          category,
          language,
          pageSize,
        },
      });

      return response.data.articles || [];
    } catch (error: any) {
      console.error('Error fetching news:', error.message);
      return [];
    }
  }

  /**
   * Fetch articles by search query for specific topics
   */
  async fetchArticlesByTopic(
    topic: string,
    language: string = 'en',
    pageSize: number = 5
  ): Promise<Article[]> {
    try {
      const response = await axios.get(`${NEWS_API_URL}/everything`, {
        params: {
          apiKey: NEWS_API_KEY,
          q: topic,
          language,
          sortBy: 'popularity',
          pageSize,
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        },
      });

      return response.data.articles || [];
    } catch (error: any) {
      console.error('Error fetching topic articles:', error.message);
      return [];
    }
  }

  /**
   * Extract key vocabulary from article text
   * This is a simplified version - in production, you'd use NLP libraries
   */
  extractVocabulary(text: string, language: string = 'ENGLISH'): string[] {
    if (!text) return [];

    // Remove common words (stop words)
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
    ]);

    // Split into words and clean
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s'-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top words by frequency (appearing 2+ times)
    const keyWords = Object.entries(wordFreq)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, _]) => word);

    return keyWords;
  }

  /**
   * Get all trending content across categories
   */
  async getAllTrendingContent(): Promise<Map<string, Article[]>> {
    const contentMap = new Map<string, Article[]>();

    for (const mapping of CATEGORY_MAPPINGS) {
      const articles = await this.fetchTrendingArticles(
        mapping.newsCategory,
        'en',
        5
      );
      contentMap.set(mapping.flashcardCategory, articles);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return contentMap;
  }

  /**
   * Fetch pop culture content from specific topics
   */
  async getPopCultureContent(): Promise<Article[]> {
    const topics = [
      'movies 2025',
      'Netflix series',
      'Taylor Swift',
      'gaming',
      'popular music',
      'viral trends',
    ];

    const allArticles: Article[] = [];

    for (const topic of topics) {
      const articles = await this.fetchArticlesByTopic(topic, 'en', 3);
      allArticles.push(...articles);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allArticles;
  }
}

export const contentFetchService = new ContentFetchService();
