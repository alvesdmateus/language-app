import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
  // Vocabulary Questions
  {
    type: 'vocabulary',
    difficulty: 1,
    question: 'What is the English translation of "Hola"?',
    correctAnswer: 'Hello',
    options: ['Hello', 'Goodbye', 'Please', 'Thank you'],
    explanation: 'Hola is a common Spanish greeting meaning Hello.',
    language: 'es',
  },
  {
    type: 'vocabulary',
    difficulty: 1,
    question: 'Which word means "Thank you" in French?',
    correctAnswer: 'Merci',
    options: ['Merci', 'Bonjour', 'Au revoir', 'Oui'],
    explanation: 'Merci is the French word for Thank you.',
    language: 'fr',
  },
  {
    type: 'vocabulary',
    difficulty: 1,
    question: 'What does "Guten Tag" mean in German?',
    correctAnswer: 'Good day',
    options: ['Good day', 'Good night', 'Goodbye', 'Welcome'],
    explanation: 'Guten Tag is a German greeting meaning Good day.',
    language: 'de',
  },
  {
    type: 'vocabulary',
    difficulty: 2,
    question: 'What is "Library" in Spanish?',
    correctAnswer: 'Biblioteca',
    options: ['Biblioteca', 'Librería', 'Libro', 'Libreta'],
    explanation: 'Biblioteca means library. Librería means bookstore.',
    language: 'es',
  },
  {
    type: 'vocabulary',
    difficulty: 2,
    question: 'Which French word means "Yesterday"?',
    correctAnswer: 'Hier',
    options: ['Hier', 'Aujourd\'hui', 'Demain', 'Maintenant'],
    explanation: 'Hier means yesterday in French.',
    language: 'fr',
  },
  {
    type: 'vocabulary',
    difficulty: 2,
    question: 'What does "Gesundheit" mean in German?',
    correctAnswer: 'Health/Bless you',
    options: ['Health/Bless you', 'Goodbye', 'Good luck', 'Cheers'],
    explanation: 'Gesundheit literally means health and is used when someone sneezes.',
    language: 'de',
  },
  {
    type: 'vocabulary',
    difficulty: 3,
    question: 'What is the Spanish word for "Butterfly"?',
    correctAnswer: 'Mariposa',
    options: ['Mariposa', 'Abeja', 'Mosca', 'Hormiga'],
    explanation: 'Mariposa means butterfly. Abeja is bee, mosca is fly, hormiga is ant.',
    language: 'es',
  },
  {
    type: 'vocabulary',
    difficulty: 3,
    question: 'Which French word means "Breadcrumb"?',
    correctAnswer: 'Miette',
    options: ['Miette', 'Pain', 'Croûte', 'Farine'],
    explanation: 'Miette means breadcrumb or crumb in French.',
    language: 'fr',
  },

  // Grammar Questions
  {
    type: 'grammar',
    difficulty: 1,
    question: 'Complete: "I ___ a student"',
    correctAnswer: 'am',
    options: ['am', 'is', 'are', 'be'],
    explanation: 'With "I", we use "am" in present tense.',
    language: 'en',
  },
  {
    type: 'grammar',
    difficulty: 1,
    question: 'Choose the correct verb: "She ___ to school every day"',
    correctAnswer: 'goes',
    options: ['go', 'goes', 'going', 'gone'],
    explanation: 'Third person singular (she) uses "goes" in present simple.',
    language: 'en',
  },
  {
    type: 'grammar',
    difficulty: 2,
    question: 'Which is correct: "Yo ___ español"',
    correctAnswer: 'hablo',
    options: ['hablo', 'hablas', 'habla', 'hablan'],
    explanation: 'First person singular "Yo" uses "hablo" (I speak).',
    language: 'es',
  },
  {
    type: 'grammar',
    difficulty: 2,
    question: 'Complete in French: "Je ___ français"',
    correctAnswer: 'parle',
    options: ['parle', 'parles', 'parlons', 'parlent'],
    explanation: 'First person singular "Je" uses "parle" (I speak).',
    language: 'fr',
  },
  {
    type: 'grammar',
    difficulty: 3,
    question: 'Which is the correct past tense: "Yesterday, I ___ to the store"',
    correctAnswer: 'went',
    options: ['go', 'went', 'gone', 'going'],
    explanation: 'Past simple of "go" is "went".',
    language: 'en',
  },
  {
    type: 'grammar',
    difficulty: 3,
    question: 'Complete: "Si yo ___ rico, viajaría mucho" (If I were rich...)',
    correctAnswer: 'fuera',
    options: ['soy', 'era', 'fuera', 'ser'],
    explanation: 'Subjunctive imperfect "fuera" is used in hypothetical conditions.',
    language: 'es',
  },

  // Pronunciation Questions
  {
    type: 'pronunciation',
    difficulty: 1,
    question: 'How many syllables are in "beautiful"?',
    correctAnswer: '3',
    options: ['2', '3', '4', '5'],
    explanation: 'Beautiful has 3 syllables: beau-ti-ful.',
    language: 'en',
  },
  {
    type: 'pronunciation',
    difficulty: 2,
    question: 'Which word has a silent "h"?',
    correctAnswer: 'honor',
    options: ['house', 'honor', 'hero', 'help'],
    explanation: 'Honor is pronounced without the "h" sound.',
    language: 'en',
  },

  // Reading Comprehension
  {
    type: 'comprehension',
    difficulty: 2,
    question: 'Read: "The cat sat on the mat." Where is the cat?',
    correctAnswer: 'On the mat',
    options: ['On the mat', 'Under the mat', 'Near the mat', 'Behind the mat'],
    explanation: 'The sentence clearly states the cat sat "on" the mat.',
    language: 'en',
  },
  {
    type: 'comprehension',
    difficulty: 3,
    question: '"El perro corre en el parque." What is the dog doing?',
    correctAnswer: 'Running',
    options: ['Running', 'Walking', 'Sleeping', 'Eating'],
    explanation: '"Corre" means runs/is running in Spanish.',
    language: 'es',
  },

  // Additional Vocabulary
  {
    type: 'vocabulary',
    difficulty: 1,
    question: 'What is "Water" in Spanish?',
    correctAnswer: 'Agua',
    options: ['Agua', 'Vino', 'Leche', 'Jugo'],
    explanation: 'Agua means water in Spanish.',
    language: 'es',
  },
  {
    type: 'vocabulary',
    difficulty: 1,
    question: 'What is "Dog" in French?',
    correctAnswer: 'Chien',
    options: ['Chat', 'Chien', 'Oiseau', 'Poisson'],
    explanation: 'Chien means dog. Chat is cat.',
    language: 'fr',
  },
  {
    type: 'vocabulary',
    difficulty: 1,
    question: 'What does "Casa" mean in Spanish?',
    correctAnswer: 'House',
    options: ['House', 'Car', 'Tree', 'School'],
    explanation: 'Casa means house or home in Spanish.',
    language: 'es',
  },
  {
    type: 'vocabulary',
    difficulty: 2,
    question: 'What is "Breakfast" in French?',
    correctAnswer: 'Petit-déjeuner',
    options: ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Goûter'],
    explanation: 'Petit-déjeuner is breakfast. Déjeuner is lunch, dîner is dinner.',
    language: 'fr',
  },
  {
    type: 'vocabulary',
    difficulty: 2,
    question: 'Which Spanish word means "To learn"?',
    correctAnswer: 'Aprender',
    options: ['Aprender', 'Enseñar', 'Estudiar', 'Leer'],
    explanation: 'Aprender means to learn. Enseñar is to teach.',
    language: 'es',
  },
  {
    type: 'vocabulary',
    difficulty: 3,
    question: 'What is "Entrepreneurship" in French?',
    correctAnswer: 'Entrepreneuriat',
    options: ['Entrepreneuriat', 'Entreprise', 'Affaires', 'Commerce'],
    explanation: 'Entrepreneuriat means entrepreneurship. Entreprise is business/company.',
    language: 'fr',
  },

  // More Grammar
  {
    type: 'grammar',
    difficulty: 1,
    question: 'Choose the plural: "One child, two ___"',
    correctAnswer: 'children',
    options: ['childs', 'children', 'childrens', 'child'],
    explanation: 'The irregular plural of child is children.',
    language: 'en',
  },
  {
    type: 'grammar',
    difficulty: 2,
    question: 'Complete: "They ___ playing soccer now"',
    correctAnswer: 'are',
    options: ['is', 'are', 'am', 'be'],
    explanation: 'Present continuous with "they" uses "are".',
    language: 'en',
  },
  {
    type: 'grammar',
    difficulty: 3,
    question: 'Which is correct in French: "Nous ___ allés au cinéma"',
    correctAnswer: 'sommes',
    options: ['avons', 'sommes', 'êtes', 'sont'],
    explanation: 'Aller uses être as auxiliary, so "nous sommes allés".',
    language: 'fr',
  },

  // Idioms and Expressions
  {
    type: 'idiom',
    difficulty: 3,
    question: 'What does "It\'s raining cats and dogs" mean?',
    correctAnswer: 'It\'s raining heavily',
    options: ['It\'s raining heavily', 'Animals are falling', 'It\'s a sunny day', 'It\'s slightly drizzling'],
    explanation: 'This idiom means it\'s raining very heavily.',
    language: 'en',
  },
  {
    type: 'idiom',
    difficulty: 3,
    question: 'What does "Coûter les yeux de la tête" mean in French?',
    correctAnswer: 'To be very expensive',
    options: ['To be very expensive', 'To be beautiful', 'To be painful', 'To be obvious'],
    explanation: 'Literally "to cost the eyes of the head", means very expensive.',
    language: 'fr',
  },
  {
    type: 'idiom',
    difficulty: 3,
    question: 'What does "No hay mal que por bien no venga" mean?',
    correctAnswer: 'Every cloud has a silver lining',
    options: ['Every cloud has a silver lining', 'Bad things happen', 'Good things come', 'Nothing is certain'],
    explanation: 'Spanish proverb meaning something good can come from bad situations.',
    language: 'es',
  },
];

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  console.log('Clearing existing questions...');
  await prisma.question.deleteMany({});
  await prisma.dailyQuizCompletion.deleteMany({});
  await prisma.dailyQuiz.deleteMany({});
  await prisma.matchResult.deleteMany({});
  await prisma.match.deleteMany({});

  // Create questions
  console.log('Creating questions...');
  const difficultyMap: { [key: number]: string } = {
    1: 'EASY',
    2: 'MEDIUM',
    3: 'HARD',
  };

  for (const question of questions) {
    await prisma.question.create({
      data: {
        type: question.type,
        difficulty: difficultyMap[question.difficulty],
        question: question.question,
        correctAnswer: question.correctAnswer,
        options: question.options,
        explanation: question.explanation,
        language: question.language,
      },
    });
  }

  console.log(`Created ${questions.length} questions`);

  // Create sample users for testing
  console.log('Creating sample users...');
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const { getDivisionFromElo } = require('../src/utils/division');

  const users = [
    { username: 'alice', email: 'alice@example.com', displayName: 'Alice', eloRating: 1200 },
    { username: 'bob', email: 'bob@example.com', displayName: 'Bob', eloRating: 1180 },
    { username: 'charlie', email: 'charlie@example.com', displayName: 'Charlie', eloRating: 1220 },
    { username: 'diana', email: 'diana@example.com', displayName: 'Diana', eloRating: 1000 },
    { username: 'eve', email: 'eve@example.com', displayName: 'Eve', eloRating: 1500 },
    { username: 'frank', email: 'frank@example.com', displayName: 'Frank', eloRating: 1750 },
    { username: 'grace', email: 'grace@example.com', displayName: 'Grace', eloRating: 2100 },
    { username: 'henry', email: 'henry@example.com', displayName: 'Henry', eloRating: 850 },
  ];

  for (const user of users) {
    const divisionInfo = getDivisionFromElo(user.eloRating);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: hashedPassword,
        division: divisionInfo.division,
        totalPoints: Math.floor(Math.random() * 1000),
        currentStreak: Math.floor(Math.random() * 30),
        longestStreak: Math.floor(Math.random() * 50),
      },
    });
  }

  console.log('Created sample users with divisions');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
