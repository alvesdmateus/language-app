import { PrismaClient, FlashcardCategory, ContentSource, Language, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFlashcards() {
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
      console.log(`✅ Created: ${card.frontText} -> ${card.backText}`);
    } else {
      console.log(`⏭️  Skipped (exists): ${card.frontText}`);
    }
  }

  console.log(`\n🎉 Seeded ${created} curated flashcards!`);
  await prisma.$disconnect();
}

seedFlashcards()
  .catch((error) => {
    console.error('Error seeding flashcards:', error);
    process.exit(1);
  });
