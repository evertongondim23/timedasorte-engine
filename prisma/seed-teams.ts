import { PrismaClient } from '@prisma/client';
import { BRAZILIAN_TEAMS_SEED } from './teams-seed-data';

const prisma = new PrismaClient();

/**
 * 25 clubes brasileiros associados aos animais do Jogo do Bicho.
 * Fonte única: `teams-seed-data.ts` (mesma usada em `seed.ts`).
 *
 * Se já existirem linhas antigas (nome = animal), apague a tabela `Team` ou
 * rode `prisma migrate reset` em dev antes de resemear.
 */
async function seedTeams() {
  console.log('🎲 Iniciando seed dos times...');

  for (const team of BRAZILIAN_TEAMS_SEED) {
    const existing = await prisma.team.findUnique({
      where: { name: team.name },
    });

    if (existing) {
      console.log(`  ⏭️  Time "${team.name}" já existe. Pulando...`);
      continue;
    }

    await prisma.team.create({
      data: {
        ...team,
        isActive: true,
      },
    });

    console.log(`  ✅ Time "${team.name}" (${team.animal}) criado com sucesso!`);
  }

  console.log('🎉 Seed dos times concluído!');
}

async function main() {
  try {
    await seedTeams();
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
