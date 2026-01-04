-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'READY_CHECK';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "playerConnections" JSONB,
ADD COLUMN     "readyCheckStartedAt" TIMESTAMP(3);
