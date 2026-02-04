-- AlterEnum
ALTER TYPE "DrawStatus" ADD VALUE 'PENDING_RESULT';
ALTER TYPE "DrawStatus" ADD VALUE 'PUBLISHED';

-- CreateEnum
CREATE TYPE "RoundCategory" AS ENUM ('PTM', 'PPT', 'PT', 'PTV', 'PTN', 'COR');

-- AlterTable
ALTER TABLE "Draw" ADD COLUMN "category" "RoundCategory" NOT NULL DEFAULT 'PTM';

-- CreateIndex
CREATE INDEX "Draw_category_idx" ON "Draw"("category");
CREATE INDEX "Draw_category_scheduledAt_idx" ON "Draw"("category", "scheduledAt");
