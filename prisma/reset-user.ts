// Script para resetar ou deletar usuário
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const action = process.argv[3] || "reset"; // reset ou delete

  if (!email) {
    console.error("❌ Uso: npm run reset-user <email> [reset|delete]");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ Usuário ${email} não encontrado no banco`);
      process.exit(1);
    }

    if (action === "delete") {
      // Deletar usuário
      await prisma.user.delete({
        where: { email },
      });
      console.log(`✅ Usuário ${email} deletado com sucesso`);
    } else {
      // Resetar senha para padrão
      const newPassword = "User123@";
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
        },
      });

      console.log(`✅ Senha do usuário ${email} resetada com sucesso`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Nova senha: ${newPassword}`);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
