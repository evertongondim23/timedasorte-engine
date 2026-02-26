/**
 * Gera rodadas para os próximos dias (Seg–Sex).
 * Uso: npm run generate:rounds
 * Opcional: ROUNDS_DAYS=30 npm run generate:rounds
 *
 * Equivalente ao cron que roda à meia-noite; não depende do Nest.
 */

/// <reference types="node" />
import { PrismaClient, RoundCategory, DrawStatus, ResultSource } from '@prisma/client';

const DAYS = parseInt(process.env.ROUNDS_DAYS || '7', 10);
const CUTOFF_MINUTES = 30;

const SCHEDULE: { category: RoundCategory; hour: number; minute: number; isNextDay?: boolean }[] = [
  { category: RoundCategory.PTM, hour: 11, minute: 0 },
  { category: RoundCategory.PPT, hour: 14, minute: 0 },
  { category: RoundCategory.PT, hour: 16, minute: 0 },
  { category: RoundCategory.PTV, hour: 18, minute: 0 },
  { category: RoundCategory.PTN, hour: 21, minute: 0 },
  { category: RoundCategory.COR, hour: 0, minute: 30, isNextDay: true },
];

function calculateScheduledAt(date: Date, item: (typeof SCHEDULE)[0]): Date {
  const d = new Date(date);
  if (item.isNextDay) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(item.hour, item.minute, 0, 0);
  return d;
}

function calculateCutoffAt(scheduledAt: Date): Date {
  const cutoff = new Date(scheduledAt);
  cutoff.setMinutes(cutoff.getMinutes() - CUTOFF_MINUTES);
  return cutoff;
}

function calculateStatus(scheduledAt: Date, cutoffAt: Date): DrawStatus {
  const now = new Date();
  if (now < cutoffAt) return DrawStatus.OPEN;
  if (now < scheduledAt) return DrawStatus.CLOSED;
  return DrawStatus.PENDING_RESULT;
}

async function main() {
  console.log('🔄 Gerando rodadas para os próximos', DAYS, 'dias...');
  const prisma = new PrismaClient();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let created = 0;

    for (let i = 0; i < DAYS; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const item of SCHEDULE) {
        const scheduledAt = calculateScheduledAt(date, item);
        const cutoffAt = calculateCutoffAt(scheduledAt);

        const existing = await prisma.draw.findFirst({
          where: {
            category: item.category,
            scheduledAt: {
              gte: new Date(scheduledAt.getTime() - 60000),
              lte: new Date(scheduledAt.getTime() + 60000),
            },
            deletedAt: null,
          },
        });

        if (!existing) {
          await prisma.draw.create({
            data: {
              category: item.category,
              scheduledAt,
              cutoffAt,
              status: calculateStatus(scheduledAt, cutoffAt),
              source: ResultSource.OFFICIAL,
              milhares: [],
              jerseys: [],
              teams: [],
            },
          });
          created++;
        }
      }
    }

    console.log('✅ Rodadas geradas com sucesso. Criadas:', created);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Erro ao gerar rodadas:', err);
  process.exit(1);
});
