// prisma/seed.ts
import { PrismaClient, Roles, UserStatus, KYCStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { BRAZILIAN_TEAMS_SEED } from "./teams-seed-data";

const prisma = new PrismaClient();

export async function runSeed() {
  console.log("🌱 Iniciando seed do banco de dados do Jogo da Sorte...");
  console.log("");

  try {
    // 1. Criar usuários
    console.log("👥 Criando usuários...");
    const adminUser = await seedAdminUser();
    const operatorUser = await seedOperatorUser();
    const regularUser = await seedRegularUser();

    // 2. Criar empresa padrão
    console.log("");
    console.log("🏢 Criando empresa padrão...");
    const company = await seedDefaultCompany();

    // 3. Criar os 25 times brasileiros
    console.log("");
    console.log("⚽ Criando times/animais...");
    await seedTeams();

    // 4. Criar carteiras para os usuários
    console.log("");
    console.log("💰 Criando carteiras...");
    await seedWallets([regularUser.id]);

    // 5. (Opcional) Criar dados de exemplo para desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("");
      console.log("🎲 Criando dados de exemplo (desenvolvimento)...");
      // await seedSampleBets(regularUser.id);
      // await seedSampleDraws();
    }

    console.log("");
    console.log("✅ Seed concluído com sucesso!");
    console.log("");
    console.log("📋 Credenciais criadas:");
    console.log("  Admin:    admin@jogodasorte.com / Admin123@");
    console.log("  Operador: operador@jogodasorte.com / Operador123@");
    console.log("  Usuário:  usuario@jogodasorte.com / User123@");
    console.log("");
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  }
}

// ===============================================
// 👥 SEED DE USUÁRIOS
// ===============================================

async function seedAdminUser() {
  const email = "admin@jogodasorte.com";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("  ℹ️  Usuário admin já existe");
    return exists;
  }

  const hashedPassword = await bcrypt.hash("Admin123@", 10);

  const user = await prisma.user.create({
    data: {
      name: "Administrador do Sistema",
      email,
      password: hashedPassword,
      role: Roles.SYSTEM_ADMIN,
      status: UserStatus.ACTIVE,
      phone: "(11) 99999-0000",
      cpf: "000.000.000-00",
      city: "São Paulo",
      state: "SP",
    },
  });

  console.log("  ✅ Usuário admin criado:", email);
  return user;
}

async function seedOperatorUser() {
  const email = "operador@jogodasorte.com";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("  ℹ️  Usuário operador já existe");
    return exists;
  }

  const hashedPassword = await bcrypt.hash("Operador123@", 10);

  const user = await prisma.user.create({
    data: {
      name: "Operador do Sistema",
      email,
      password: hashedPassword,
      role: Roles.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "(11) 98888-0000",
      cpf: "111.111.111-00",
      city: "São Paulo",
      state: "SP",
    },
  });

  console.log("  ✅ Usuário operador criado:", email);
  return user;
}

async function seedRegularUser() {
  const email = "usuario@jogodasorte.com";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("  ℹ️  Usuário regular já existe");
    return exists;
  }

  const hashedPassword = await bcrypt.hash("User123@", 10);

  const user = await prisma.user.create({
    data: {
      name: "João da Silva",
      email,
      password: hashedPassword,
      role: Roles.USER,
      status: UserStatus.ACTIVE,
      phone: "(11) 97777-0000",
      cpf: "123.456.789-00",
      city: "São Paulo",
      state: "SP",
      address: "Rua das Flores, 123",
      zipCode: "01234-567",
      birthDate: new Date("1990-05-15"),
      kycStatus: KYCStatus.PENDING,
    },
  });

  console.log("  ✅ Usuário regular criado:", email);
  return user;
}

// ===============================================
// 🏢 SEED DE EMPRESA PADRÃO
// ===============================================

async function seedDefaultCompany() {
  const name = "Jogo da Sorte";

  const exists = await prisma.company.findFirst({ where: { name } });
  if (exists) {
    console.log("  ℹ️  Empresa padrão já existe");
    return exists;
  }

  const company = await prisma.company.create({
    data: {
      name: "Jogo da Sorte",
      cnpj: "00.000.000/0001-00",
      website: "https://jogodasorte.com.br",
      contactEmail: "contato@jogodasorte.com.br",
      contactPhone: "(11) 3000-0000",
    },
  });

  console.log("  ✅ Empresa criada:", name);
  return company;
}

// ===============================================
// ⚽ SEED DOS 25 TIMES BRASILEIROS
// ===============================================

async function seedTeams() {
  const brazilianTeams = BRAZILIAN_TEAMS_SEED.map((t) => ({
    ...t,
    isActive: true,
  }));

  let created = 0;
  let skipped = 0;

  for (const teamData of brazilianTeams) {
    const exists = await prisma.team.findUnique({
      where: { name: teamData.name },
    });

    if (!exists) {
      await prisma.team.create({ data: teamData });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`  ✅ Times criados: ${created}`);
  if (skipped > 0) {
    console.log(`  ℹ️  Times já existentes: ${skipped}`);
  }
}

// ===============================================
// 💰 SEED DE CARTEIRAS
// ===============================================

async function seedWallets(userIds: string[]) {
  let created = 0;
  let skipped = 0;

  for (const userId of userIds) {
    const exists = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!exists) {
      await prisma.wallet.create({
        data: {
          userId,
          balance: 100.0, // Saldo inicial de R$ 100,00 para testes
          blockedBalance: 0,
          totalDeposited: 100.0,
          totalWithdrawn: 0,
          totalWon: 0,
          totalLost: 0,
        },
      });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`  ✅ Carteiras criadas: ${created}`);
  if (skipped > 0) {
    console.log(`  ℹ️  Carteiras já existentes: ${skipped}`);
  }
}

// ===============================================
// 🎲 SEED DE DADOS DE EXEMPLO (DESENVOLVIMENTO)
// ===============================================

// Descomentar quando os módulos estiverem implementados
/*
async function seedSampleBets(userId: string) {
  // Criar algumas apostas de exemplo
  const teams = await prisma.team.findMany({ take: 5 });
  
  const bet = await prisma.bet.create({
    data: {
      userId,
      modality: 'TIME',
      amount: 10.0,
      status: 'PENDING',
      selectedTeams: {
        connect: [{ id: teams[0].id }],
      },
      selectedJerseys: [teams[0].jerseys[0]],
    },
  });

  console.log('  ✅ Aposta de exemplo criada');
}

async function seedSampleDraws() {
  // Criar um sorteio de exemplo
  const draw = await prisma.draw.create({
    data: {
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      status: 'SCHEDULED',
      milhares: [],
      jerseys: [],
      teams: [],
    },
  });

  console.log('  ✅ Sorteio de exemplo criado');
}
*/

// ===============================================
// 🚀 EXECUTAR SEED
// ===============================================

// Executar seed se chamado diretamente
if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
