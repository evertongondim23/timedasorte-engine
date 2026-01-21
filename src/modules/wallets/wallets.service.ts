import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma carteira para um usuário
   */
  async create(createWalletDto: CreateWalletDto) {
    // Verificar se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: createWalletDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${createWalletDto.userId} não encontrado`,
      );
    }

    // Verificar se já tem carteira
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId: createWalletDto.userId },
    });

    if (existingWallet) {
      throw new ConflictException(
        `Usuário já possui uma carteira`,
      );
    }

    // Criar carteira
    return this.prisma.wallet.create({
      data: {
        userId: createWalletDto.userId,
        balance: 0,
        blockedBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalWon: 0,
        totalLost: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Lista todas as carteiras (admin)
   */
  async findAll() {
    return this.prisma.wallet.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Busca uma carteira por ID
   */
  async findOne(id: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(`Carteira com ID ${id} não encontrada`);
    }

    return wallet;
  }

  /**
   * Busca carteira por userId
   */
  async findByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Carteira do usuário ${userId} não encontrada`,
      );
    }

    return wallet;
  }

  /**
   * Atualiza uma carteira
   */
  async update(id: string, updateWalletDto: UpdateWalletDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.wallet.update({
      where: { id },
      data: updateWalletDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Remove uma carteira (soft delete)
   */
  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.wallet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Deposita um valor na carteira
   */
  async deposit(userId: string, depositDto: DepositDto) {
    const wallet = await this.findByUserId(userId);

    // Atualizar saldo e totais
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: depositDto.amount,
        },
        totalDeposited: {
          increment: depositDto.amount,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      wallet: updatedWallet,
      message: `Depósito de R$ ${depositDto.amount.toFixed(2)} realizado com sucesso`,
    };
  }

  /**
   * Saca um valor da carteira
   */
  async withdraw(userId: string, withdrawDto: WithdrawDto) {
    const wallet = await this.findByUserId(userId);

    // Verificar saldo disponível
    if (wallet.balance < withdrawDto.amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponível: R$ ${wallet.balance.toFixed(2)}`,
      );
    }

    // Atualizar saldo e totais
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: withdrawDto.amount,
        },
        totalWithdrawn: {
          increment: withdrawDto.amount,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      wallet: updatedWallet,
      message: `Saque de R$ ${withdrawDto.amount.toFixed(2)} realizado com sucesso`,
    };
  }

  /**
   * Bloqueia saldo (para apostas pendentes)
   */
  async blockBalance(userId: string, amount: number) {
    const wallet = await this.findByUserId(userId);

    if (wallet.balance < amount) {
      throw new BadRequestException(
        `Saldo insuficiente para bloquear. Disponível: R$ ${wallet.balance.toFixed(2)}`,
      );
    }

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
        blockedBalance: {
          increment: amount,
        },
      },
    });
  }

  /**
   * Desbloqueia saldo (após processamento da aposta)
   */
  async unblockBalance(userId: string, amount: number) {
    const wallet = await this.findByUserId(userId);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        blockedBalance: {
          decrement: amount,
        },
        balance: {
          increment: amount,
        },
      },
    });
  }

  /**
   * Adiciona prêmio à carteira
   */
  async addPrize(userId: string, amount: number) {
    const wallet = await this.findByUserId(userId);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        blockedBalance: {
          decrement: amount, // Remove do bloqueado
        },
        balance: {
          increment: amount, // Adiciona ao disponível
        },
        totalWon: {
          increment: amount,
        },
      },
    });
  }

  /**
   * Registra perda de aposta
   */
  async registerLoss(userId: string, amount: number) {
    const wallet = await this.findByUserId(userId);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        blockedBalance: {
          decrement: amount, // Remove do bloqueado
        },
        totalLost: {
          increment: amount,
        },
      },
    });
  }

  /**
   * Consulta saldo disponível
   */
  async getBalance(userId: string) {
    const wallet = await this.findByUserId(userId);

    return {
      balance: wallet.balance,
      blockedBalance: wallet.blockedBalance,
      availableBalance: wallet.balance,
      totalBalance: wallet.balance + wallet.blockedBalance,
      totalDeposited: wallet.totalDeposited,
      totalWithdrawn: wallet.totalWithdrawn,
      totalWon: wallet.totalWon,
      totalLost: wallet.totalLost,
      profit: wallet.totalWon - wallet.totalLost,
    };
  }
}
