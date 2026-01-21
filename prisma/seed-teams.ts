import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 25 Times brasileiros com animais associados
 * Cada time tem 4 camisas (00-99)
 */
const brazilianTeams = [
  {
    name: 'Avestruz',
    animal: 'Avestruz',
    animalEmoji: '🦤',
    jerseys: [1, 2, 3, 4],
    color: '#FF6B6B',
    shield: '🦤',
  },
  {
    name: 'Águia',
    animal: 'Águia',
    animalEmoji: '🦅',
    jerseys: [5, 6, 7, 8],
    color: '#4ECDC4',
    shield: '🦅',
  },
  {
    name: 'Burro',
    animal: 'Burro',
    animalEmoji: '🫏',
    jerseys: [9, 10, 11, 12],
    color: '#95E1D3',
    shield: '🫏',
  },
  {
    name: 'Borboleta',
    animal: 'Borboleta',
    animalEmoji: '🦋',
    jerseys: [13, 14, 15, 16],
    color: '#F38181',
    shield: '🦋',
  },
  {
    name: 'Cachorro',
    animal: 'Cachorro',
    animalEmoji: '🐕',
    jerseys: [17, 18, 19, 20],
    color: '#AA96DA',
    shield: '🐕',
  },
  {
    name: 'Cabra',
    animal: 'Cabra',
    animalEmoji: '🐐',
    jerseys: [21, 22, 23, 24],
    color: '#FCBAD3',
    shield: '🐐',
  },
  {
    name: 'Carneiro',
    animal: 'Carneiro',
    animalEmoji: '🐑',
    jerseys: [25, 26, 27, 28],
    color: '#FFFFD2',
    shield: '🐑',
  },
  {
    name: 'Camelo',
    animal: 'Camelo',
    animalEmoji: '🐪',
    jerseys: [29, 30, 31, 32],
    color: '#A8D8EA',
    shield: '🐪',
  },
  {
    name: 'Cobra',
    animal: 'Cobra',
    animalEmoji: '🐍',
    jerseys: [33, 34, 35, 36],
    color: '#AA96DA',
    shield: '🐍',
  },
  {
    name: 'Coelho',
    animal: 'Coelho',
    animalEmoji: '🐰',
    jerseys: [37, 38, 39, 40],
    color: '#FCBAD3',
    shield: '🐰',
  },
  {
    name: 'Cavalo',
    animal: 'Cavalo',
    animalEmoji: '🐴',
    jerseys: [41, 42, 43, 44],
    color: '#FFFFD2',
    shield: '🐴',
  },
  {
    name: 'Elefante',
    animal: 'Elefante',
    animalEmoji: '🐘',
    jerseys: [45, 46, 47, 48],
    color: '#A8D8EA',
    shield: '🐘',
  },
  {
    name: 'Galo',
    animal: 'Galo',
    animalEmoji: '🐓',
    jerseys: [49, 50, 51, 52],
    color: '#AA96DA',
    shield: '🐓',
  },
  {
    name: 'Gato',
    animal: 'Gato',
    animalEmoji: '🐱',
    jerseys: [53, 54, 55, 56],
    color: '#FCBAD3',
    shield: '🐱',
  },
  {
    name: 'Jacaré',
    animal: 'Jacaré',
    animalEmoji: '🐊',
    jerseys: [57, 58, 59, 60],
    color: '#FFFFD2',
    shield: '🐊',
  },
  {
    name: 'Leão',
    animal: 'Leão',
    animalEmoji: '🦁',
    jerseys: [61, 62, 63, 64],
    color: '#A8D8EA',
    shield: '🦁',
  },
  {
    name: 'Macaco',
    animal: 'Macaco',
    animalEmoji: '🐵',
    jerseys: [65, 66, 67, 68],
    color: '#AA96DA',
    shield: '🐵',
  },
  {
    name: 'Porco',
    animal: 'Porco',
    animalEmoji: '🐷',
    jerseys: [69, 70, 71, 72],
    color: '#FCBAD3',
    shield: '🐷',
  },
  {
    name: 'Pavão',
    animal: 'Pavão',
    animalEmoji: '🦚',
    jerseys: [73, 74, 75, 76],
    color: '#FFFFD2',
    shield: '🦚',
  },
  {
    name: 'Peru',
    animal: 'Peru',
    animalEmoji: '🦃',
    jerseys: [77, 78, 79, 80],
    color: '#A8D8EA',
    shield: '🦃',
  },
  {
    name: 'Touro',
    animal: 'Touro',
    animalEmoji: '🐂',
    jerseys: [81, 82, 83, 84],
    color: '#AA96DA',
    shield: '🐂',
  },
  {
    name: 'Tigre',
    animal: 'Tigre',
    animalEmoji: '🐯',
    jerseys: [85, 86, 87, 88],
    color: '#FCBAD3',
    shield: '🐯',
  },
  {
    name: 'Urso',
    animal: 'Urso',
    animalEmoji: '🐻',
    jerseys: [89, 90, 91, 92],
    color: '#FFFFD2',
    shield: '🐻',
  },
  {
    name: 'Veado',
    animal: 'Veado',
    animalEmoji: '🦌',
    jerseys: [93, 94, 95, 96],
    color: '#A8D8EA',
    shield: '🦌',
  },
  {
    name: 'Vaca',
    animal: 'Vaca',
    animalEmoji: '🐮',
    jerseys: [97, 98, 99, 0],
    color: '#AA96DA',
    shield: '🐮',
  },
];

async function seedTeams() {
  console.log('🎲 Iniciando seed dos times...');

  for (const team of brazilianTeams) {
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

    console.log(`  ✅ Time "${team.name}" criado com sucesso!`);
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

