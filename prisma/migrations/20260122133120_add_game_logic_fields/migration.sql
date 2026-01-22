/*
  Warnings:

  - Added the required column `cutoffAt` to the `Draw` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResultSource" AS ENUM ('ADMIN', 'OFFICIAL', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DrawStatus" ADD VALUE 'OPEN';
ALTER TYPE "DrawStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "Draw" ADD COLUMN     "cutoffAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "source" "ResultSource" NOT NULL DEFAULT 'ADMIN';

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "resultSnapshot" JSONB NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "matchedItems" TEXT[],
    "prizeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedBy" TEXT,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_betId_key" ON "Settlement"("betId");

-- CreateIndex
CREATE INDEX "Settlement_drawId_idx" ON "Settlement"("drawId");

-- CreateIndex
CREATE INDEX "Settlement_computedAt_idx" ON "Settlement"("computedAt");

-- CreateIndex
CREATE INDEX "Draw_cutoffAt_idx" ON "Draw"("cutoffAt");

-- CreateIndex
CREATE INDEX "Draw_source_idx" ON "Draw"("source");

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
