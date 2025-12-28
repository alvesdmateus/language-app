import { PrismaClient, FlashcardCategory, ContentSource, Language, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

const flashcards = [
  // SPANISH
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: 'éxito de taquilla', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.SPANISH },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: 'secuela', contextSentence: 'The sequel was even better than the original.', language: Language.SPANISH },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: 'maratonear', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.SPANISH },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: 'campeonato', contextSentence: 'They won the championship last year.', language: Language.SPANISH },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'torneo', contextSentence: 'The tennis tournament starts next week.', language: Language.SPANISH },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'teléfono inteligente', contextSentence: 'My smartphone battery lasts all day.', language: Language.SPANISH },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'algoritmo', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.SPANISH },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'lista de reproducción', contextSentence: 'I created a new playlist for working out.', language: Language.SPANISH },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'transmisión', contextSentence: 'Music streaming has changed the industry.', language: Language.SPANISH },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'receta', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.SPANISH },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: 'ingrediente', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.SPANISH },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'multijugador', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.SPANISH },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: 'logro', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.SPANISH },

  // PORTUGUESE
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: 'grande sucesso', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: 'sequência', contextSentence: 'The sequel was even better than the original.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: 'maratonar', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: 'campeonato', contextSentence: 'They won the championship last year.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'torneio', contextSentence: 'The tennis tournament starts next week.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'smartphone', contextSentence: 'My smartphone battery lasts all day.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'algoritmo', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'lista de reprodução', contextSentence: 'I created a new playlist for working out.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'streaming', contextSentence: 'Music streaming has changed the industry.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'receita', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: 'ingrediente', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'multijogador', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.PORTUGUESE },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: 'conquista', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.PORTUGUESE },

  // FRENCH
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: 'grand succès', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.FRENCH },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: 'suite', contextSentence: 'The sequel was even better than the original.', language: Language.FRENCH },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: 'regarder en boucle', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.FRENCH },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: 'championnat', contextSentence: 'They won the championship last year.', language: Language.FRENCH },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'tournoi', contextSentence: 'The tennis tournament starts next week.', language: Language.FRENCH },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'téléphone portable', contextSentence: 'My smartphone battery lasts all day.', language: Language.FRENCH },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'algorithme', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.FRENCH },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'liste de lecture', contextSentence: 'I created a new playlist for working out.', language: Language.FRENCH },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'diffusion en continu', contextSentence: 'Music streaming has changed the industry.', language: Language.FRENCH },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'recette', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.FRENCH },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: 'ingrédient', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.FRENCH },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'multijoueur', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.FRENCH },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: 'succès', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.FRENCH },

  // GERMAN
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: 'Kassenschlager', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.GERMAN },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: 'Fortsetzung', contextSentence: 'The sequel was even better than the original.', language: Language.GERMAN },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: 'durchschauen', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.GERMAN },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: 'Meisterschaft', contextSentence: 'They won the championship last year.', language: Language.GERMAN },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'Turnier', contextSentence: 'The tennis tournament starts next week.', language: Language.GERMAN },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'Smartphone', contextSentence: 'My smartphone battery lasts all day.', language: Language.GERMAN },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'Algorithmus', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.GERMAN },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'Wiedergabeliste', contextSentence: 'I created a new playlist for working out.', language: Language.GERMAN },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'Streaming', contextSentence: 'Music streaming has changed the industry.', language: Language.GERMAN },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'Rezept', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.GERMAN },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: 'Zutat', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.GERMAN },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'Mehrspieler', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.GERMAN },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: 'Erfolg', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.GERMAN },

  // ITALIAN
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: 'grande successo', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.ITALIAN },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: 'seguito', contextSentence: 'The sequel was even better than the original.', language: Language.ITALIAN },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: 'guardare in maratona', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.ITALIAN },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: 'campionato', contextSentence: 'They won the championship last year.', language: Language.ITALIAN },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'torneo', contextSentence: 'The tennis tournament starts next week.', language: Language.ITALIAN },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'smartphone', contextSentence: 'My smartphone battery lasts all day.', language: Language.ITALIAN },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'algoritmo', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.ITALIAN },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'playlist', contextSentence: 'I created a new playlist for working out.', language: Language.ITALIAN },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'streaming', contextSentence: 'Music streaming has changed the industry.', language: Language.ITALIAN },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'ricetta', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.ITALIAN },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: 'ingrediente', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.ITALIAN },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'multigiocatore', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.ITALIAN },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: 'obiettivo', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.ITALIAN },

  // JAPANESE
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: '大ヒット作', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.JAPANESE },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: '続編', contextSentence: 'The sequel was even better than the original.', language: Language.JAPANESE },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: '一気見する', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.JAPANESE },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: '選手権', contextSentence: 'They won the championship last year.', language: Language.JAPANESE },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: 'トーナメント', contextSentence: 'The tennis tournament starts next week.', language: Language.JAPANESE },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: 'スマートフォン', contextSentence: 'My smartphone battery lasts all day.', language: Language.JAPANESE },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: 'アルゴリズム', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.JAPANESE },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: 'プレイリスト', contextSentence: 'I created a new playlist for working out.', language: Language.JAPANESE },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: 'ストリーミング', contextSentence: 'Music streaming has changed the industry.', language: Language.JAPANESE },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: 'レシピ', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.JAPANESE },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: '材料', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.JAPANESE },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: 'マルチプレイヤー', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.JAPANESE },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: '実績', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.JAPANESE },

  // KOREAN
  { category: FlashcardCategory.MOVIES, frontText: 'blockbuster', backText: '블록버스터', contextSentence: 'The new Marvel movie is a blockbuster hit.', language: Language.KOREAN },
  { category: FlashcardCategory.MOVIES, frontText: 'sequel', backText: '속편', contextSentence: 'The sequel was even better than the original.', language: Language.KOREAN },
  { category: FlashcardCategory.TV_SHOWS, frontText: 'binge-watch', backText: '몰아보기', contextSentence: 'I love to binge-watch series on Netflix.', language: Language.KOREAN },
  { category: FlashcardCategory.SPORTS, frontText: 'championship', backText: '챔피언십', contextSentence: 'They won the championship last year.', language: Language.KOREAN },
  { category: FlashcardCategory.SPORTS, frontText: 'tournament', backText: '토너먼트', contextSentence: 'The tennis tournament starts next week.', language: Language.KOREAN },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'smartphone', backText: '스마트폰', contextSentence: 'My smartphone battery lasts all day.', language: Language.KOREAN },
  { category: FlashcardCategory.TECHNOLOGY, frontText: 'algorithm', backText: '알고리즘', contextSentence: 'The algorithm recommends videos based on your interests.', language: Language.KOREAN },
  { category: FlashcardCategory.MUSIC, frontText: 'playlist', backText: '재생목록', contextSentence: 'I created a new playlist for working out.', language: Language.KOREAN },
  { category: FlashcardCategory.MUSIC, frontText: 'streaming', backText: '스트리밍', contextSentence: 'Music streaming has changed the industry.', language: Language.KOREAN },
  { category: FlashcardCategory.FOOD, frontText: 'recipe', backText: '레시피', contextSentence: 'I found a great recipe for chocolate cake.', language: Language.KOREAN },
  { category: FlashcardCategory.FOOD, frontText: 'ingredient', backText: '재료', contextSentence: 'Make sure you have all the ingredients before cooking.', language: Language.KOREAN },
  { category: FlashcardCategory.GAMING, frontText: 'multiplayer', backText: '멀티플레이어', contextSentence: 'This game has an amazing multiplayer mode.', language: Language.KOREAN },
  { category: FlashcardCategory.GAMING, frontText: 'achievement', backText: '업적', contextSentence: 'I unlocked a rare achievement yesterday.', language: Language.KOREAN },
];

async function seedAllLanguages() {
  console.log('🌍 Seeding flashcards for all languages...\n');

  let created = 0;
  let skipped = 0;

  for (const card of flashcards) {
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
      console.log(`✅ ${card.language}: ${card.frontText} → ${card.backText}`);
    } else {
      skipped++;
      console.log(`⏭️  ${card.language}: ${card.frontText} (already exists)`);
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   ✅ Created: ${created} flashcards`);
  console.log(`   ⏭️  Skipped: ${skipped} flashcards`);
  console.log(`   📊 Total: ${flashcards.length} flashcards across 7 languages`);

  await prisma.$disconnect();
}

seedAllLanguages()
  .catch((error) => {
    console.error('❌ Error seeding flashcards:', error);
    process.exit(1);
  });
