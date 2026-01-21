import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { FilterTransactionsDto } from "./dto/filter-transactions.dto";
import { TransactionType, TransactionStatus } from "@prisma/client";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar uma nova transação
   */
  async create(createTransactionDto: CreateTransactionDto) {
    // Verificar se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: createTransactionDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${createTransactionDto.userId} não encontrado`
      );
    }

    // Criar transação
    return this.prisma.transaction.create({
      data: {
        userId: createTransactionDto.userId,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        status: createTransactionDto.status || TransactionStatus.PENDING,
        method: createTransactionDto.paymentMethod,
        description: createTransactionDto.description,
        externalId: createTransactionDto.referenceId,
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
   * Listar todas as transações (admin)
   */
  async findAll(filterDto?: FilterTransactionsDto) {
    const where: any = {
      deletedAt: null,
    };

    if (filterDto?.type) {
      where.type = filterDto.type;
    }

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    if (filterDto?.paymentMethod) {
      where.method = filterDto.paymentMethod;
    }

    if (filterDto?.startDate || filterDto?.endDate) {
      where.createdAt = {};
      if (filterDto.startDate) {
        where.createdAt.gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        where.createdAt.lte = new Date(filterDto.endDate);
      }
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          bet: {
            select: {
              id: true,
              modality: true,
              amount: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Listar transações do usuário autenticado
   */
  async findMyTransactions(userId: string, filterDto?: FilterTransactionsDto) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filterDto?.type) {
      where.type = filterDto.type;
    }

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    if (filterDto?.paymentMethod) {
      where.method = filterDto.paymentMethod;
    }

    if (filterDto?.startDate || filterDto?.endDate) {
      where.createdAt = {};
      if (filterDto.startDate) {
        where.createdAt.gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        where.createdAt.lte = new Date(filterDto.endDate);
      }
    }

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          bet: {
            select: {
              id: true,
              modality: true,
              amount: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar transação por ID
   */
  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bet: {
          select: {
            id: true,
            modality: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada`);
    }

    return transaction;
  }

  /**
   * Buscar transação do usuário autenticado por ID
   */
  async findMyTransaction(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        bet: {
          select: {
            id: true,
            modality: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada`);
    }

    return transaction;
  }

  /**
   * Atualizar transação
   */
  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id);

    // Se estiver atualizando status para COMPLETED, definir completedAt
    const data: any = { ...updateTransactionDto };
    if (
      updateTransactionDto.status === TransactionStatus.COMPLETED &&
      transaction.status !== TransactionStatus.COMPLETED
    ) {
      data.completedAt = new Date();
    }

    return this.prisma.transaction.update({
      where: { id },
      data,
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
   * Remover transação (soft delete)
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Resumo de transações do usuário
   */
  async getMySummary(userId: string) {
    const [totalDeposits, totalWithdrawals, totalBets, totalPrizes] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.COMPLETED,
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.WITHDRAWAL,
            status: TransactionStatus.COMPLETED,
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.BET,
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.PRIZE,
            status: TransactionStatus.COMPLETED,
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

    return {
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      totalBets: totalBets._sum.amount || 0,
      totalPrizes: totalPrizes._sum.amount || 0,
      netBalance:
        (totalDeposits._sum.amount || 0) +
        (totalPrizes._sum.amount || 0) -
        (totalWithdrawals._sum.amount || 0) -
        (totalBets._sum.amount || 0),
    };
  }
}
