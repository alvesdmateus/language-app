-- CreateEnum
CREATE TYPE "FlashcardCategory" AS ENUM ('MOVIES', 'TV_SHOWS', 'MUSIC', 'SPORTS', 'TECHNOLOGY', 'FOOD', 'TRAVEL', 'GAMING', 'NEWS', 'BUSINESS', 'SCIENCE', 'ENTERTAINMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('CURATED', 'NEWS_API', 'TRENDING', 'USER_GENERATED');

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "category" "FlashcardCategory" NOT NULL,
    "source" "ContentSource" NOT NULL DEFAULT 'CURATED',
    "frontText" TEXT NOT NULL,
    "backText" TEXT NOT NULL,
    "contextSentence" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flashcard_language_idx" ON "Flashcard"("language");

-- CreateIndex
CREATE INDEX "Flashcard_category_idx" ON "Flashcard"("category");

-- CreateIndex
CREATE INDEX "Flashcard_source_idx" ON "Flashcard"("source");

-- CreateIndex
CREATE INDEX "Flashcard_isActive_idx" ON "Flashcard"("isActive");

-- CreateIndex
CREATE INDEX "Flashcard_expiresAt_idx" ON "Flashcard"("expiresAt");
