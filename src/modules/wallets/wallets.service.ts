import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AsaasService } from "../../shared/asaas/asaas.service";
import type { AsaasPixKeyType } from "../../shared/asaas/interfaces/asaas.interface";
import { CreateWalletDto } from "./dto/create-wallet.dto";
import { UpdateWalletDto } from "./dto/update-wallet.dto";
import { DepositDto } from "./dto/deposit.dto";
import { WithdrawDto } from "./dto/withdraw.dto";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  KYCStatus,
} from "@prisma/client";

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasService,
  ) {}

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
      throw new ConflictException(`Usuário já possui uma carteira`);
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
        createdAt: "desc",
      },
    });
  }

  /**
   * Busca uma carteira por ID
   */
  async findOne(id: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
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

    if (!wallet || wallet.deletedAt) {
      throw new NotFoundException(`Carteira com ID ${id} não encontrada`);
    }

    return wallet;
  }

  /**
   * Busca carteira por userId
   */
  async findByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
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

    if (!wallet || wallet.deletedAt) {
      throw new NotFoundException(
        `Carteira do usuário ${userId} não encontrada`,
      );
    }

    return wallet;
  }

  /**
   * Busca ou cria carteira por userId
   * Útil para garantir que o usuário sempre tenha uma carteira
   */
  async findOrCreateByUserId(userId: string) {
    // Tenta encontrar a carteira existente (ativa, não deletada)
    let wallet = await this.prisma.wallet.findFirst({
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

    // Se não encontrou, cria uma nova
    if (!wallet) {
      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
      }

      // Criar carteira com saldo inicial zero
      wallet = await this.prisma.wallet.create({
        data: {
          userId: userId,
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
              status: true,
            },
          },
        },
      });
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
   * Solicita depósito via PIX (Asaas): gera cobrança e retorna QR Code para o usuário pagar.
   * O crédito na carteira deve ser feito via webhook (pagamento confirmado) ou confirmação manual.
   */
  async requestDepositPix(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<{
    paymentId: string;
    value: number;
    dueDate: string;
    pixQrCode?: {
      encodedImage: string;
      payload: string;
      expirationDate: string;
    };
    paymentLink?: string;
    message: string;
  }> {
    if (!this.asaas.isEnabled()) {
      throw new BadRequestException(
        "Depósito via PIX temporariamente indisponível. Configure a integração Asaas.",
      );
    }
    const customerId = this.asaas.getCustomerId();
    if (!customerId) {
      throw new BadRequestException(
        "Depósito via PIX não configurado (ASAAS_CUSTOMER_ID). Contate o suporte.",
      );
    }
    if (amount <= 0) {
      throw new BadRequestException("Valor do depósito deve ser positivo.");
    }
    const minDeposit = 5;
    if (amount < minDeposit) {
      throw new BadRequestException(
        `Valor mínimo para depósito é R$ ${minDeposit.toFixed(2)}`,
      );
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const payment = await this.asaas.createPayment({
      customer: customerId,
      billingType: "PIX",
      value: amount,
      dueDate: dueDateStr,
      description:
        description ??
        `Depósito Jogo da Sorte - Usuário ${userId.slice(0, 8)}...`,
      externalReference: userId,
    });

    if (!payment) {
      throw new BadRequestException(
        "Não foi possível gerar a cobrança PIX. Tente novamente.",
      );
    }

    const pixQrCode = await this.asaas.getPaymentPixQrCode(payment.id);

    this.logger.log(
      `Cobrança PIX criada: payment=${payment.id}, user=${userId}, value=${amount}`,
    );

    return {
      paymentId: payment.id,
      value: payment.value,
      dueDate: payment.dueDate,
      pixQrCode: pixQrCode
        ? {
            encodedImage: pixQrCode.encodedImage,
            payload: pixQrCode.payload,
            expirationDate: pixQrCode.expirationDate,
          }
        : undefined,
      paymentLink: payment.paymentLink,
      message:
        "Pague o PIX usando o QR Code ou copie e cole o código. O saldo será creditado após confirmação.",
    };
  }

  /**
   * Deposita um valor na carteira
   */
  async deposit(userId: string, depositDto: DepositDto) {
    const wallet = await this.findOrCreateByUserId(userId);

    // Criar transação e atualizar carteira em uma transação do banco
    const result = await this.prisma.$transaction(async (tx) => {
      // Se vier um externalId (ex.: pagamento PIX Asaas), tornar operação idempotente
      // para evitar crédito duplicado em caso de reenvio de webhook.
      if (depositDto.externalId) {
        const existing = await tx.transaction.findFirst({
          where: {
            externalId: depositDto.externalId,
            type: TransactionType.DEPOSIT,
          },
        });

        if (existing) {
          this.logger.log(
            `Depósito já processado para externalId=${depositDto.externalId}, ignorando duplicata.`,
          );

          const existingWallet = await tx.wallet.findUnique({
            where: { id: wallet.id },
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

          if (!existingWallet) {
            throw new NotFoundException(
              `Carteira do usuário ${userId} não encontrada ao reconciliar depósito`,
            );
          }

          return { wallet: existingWallet, transaction: existing };
        }
      }

      // Criar registro de transação
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.DEPOSIT,
          amount: depositDto.amount,
          status: TransactionStatus.COMPLETED,
          method: depositDto.method || PaymentMethod.PIX,
          description:
            depositDto.description ||
            `Depósito via ${depositDto.method || "PIX"}`,
          externalId: depositDto.externalId,
          completedAt: new Date(),
        },
      });

      // Atualizar saldo e totais da carteira
      const updatedWallet = await tx.wallet.update({
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

      return { wallet: updatedWallet, transaction };
    });

    this.logger.log(
      `✅ Depósito de R$ ${depositDto.amount.toFixed(2)} realizado para usuário ${userId}`,
    );

    return {
      wallet: result.wallet,
      transaction: result.transaction,
      message: `Depósito de R$ ${depositDto.amount.toFixed(2)} realizado com sucesso`,
    };
  }

  /**
   * Saca um valor da carteira
   */
  async withdraw(userId: string, withdrawDto: WithdrawDto) {
    // Se for saque via PIX (ou método não especificado, default PIX), exigir KYC aprovado
    const isPixWithdrawal =
      withdrawDto.method === PaymentMethod.PIX || !withdrawDto.method;

    if (isPixWithdrawal) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, kycStatus: true },
      });

      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      if (user.kycStatus !== KYCStatus.APPROVED) {
        if (user.kycStatus === KYCStatus.REJECTED) {
          throw new ForbiddenException({
            code: "KYC_REJECTED",
            message:
              "Seus documentos foram reprovados. Envie uma nova selfie com documento para habilitar saques via PIX.",
          });
        }

        throw new ForbiddenException({
          code: "KYC_REQUIRED",
          message:
            "Para sua segurança, finalize a verificação de identidade (selfie com documento) para habilitar saques via PIX.",
        });
      }
    }

    const wallet = await this.findOrCreateByUserId(userId);

    // Verificar saldo disponível
    if (wallet.balance < withdrawDto.amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponível: R$ ${wallet.balance.toFixed(2)}`,
      );
    }

    // Valor mínimo para saque
    const minWithdrawal = 10;
    if (withdrawDto.amount < minWithdrawal) {
      throw new BadRequestException(
        `Valor mínimo para saque é R$ ${minWithdrawal.toFixed(2)}`,
      );
    }

    // Criar transação e atualizar carteira em uma transação do banco
    const result = await this.prisma.$transaction(async (tx) => {
      // Criar registro de transação com status PROCESSING (aguardando aprovação)
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAWAL,
          amount: withdrawDto.amount,
          status: TransactionStatus.PROCESSING,
          method: withdrawDto.method || PaymentMethod.PIX,
          description:
            withdrawDto.description ||
            `Saque via ${withdrawDto.method || "PIX"}`,
        },
      });

      // Atualizar saldo e totais da carteira
      const updatedWallet = await tx.wallet.update({
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

      return { wallet: updatedWallet, transaction };
    });

    // Se integração Asaas ativa e saque via PIX com chave, dispara transferência PIX
    if (
      this.asaas.isEnabled() &&
      (withdrawDto.method === PaymentMethod.PIX || !withdrawDto.method) &&
      withdrawDto.pixKey
    ) {
      try {
        const keyType = this.inferPixKeyType(withdrawDto.pixKey);
        await this.asaas.transferToPix({
          value: withdrawDto.amount,
          pixAddressKey: withdrawDto.pixKey,
          pixAddressKeyType: keyType,
          description:
            withdrawDto.description ??
            `Saque Jogo da Sorte - ${userId.slice(0, 8)}`,
        });
        this.logger.log(
          `Transferência PIX Asaas disparada para usuário ${userId}, valor R$ ${withdrawDto.amount.toFixed(2)}`,
        );
      } catch (err) {
        this.logger.error(
          `Falha ao enviar PIX via Asaas para ${userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
        // Não falha o saque interno; o valor já foi debitado. Requer conciliação manual ou retry.
      }
    }

    this.logger.log(
      `✅ Saque de R$ ${withdrawDto.amount.toFixed(2)} solicitado para usuário ${userId}`,
    );

    return {
      wallet: result.wallet,
      transaction: result.transaction,
      message: `Saque de R$ ${withdrawDto.amount.toFixed(2)} solicitado com sucesso. Será processado em até 48 horas.`,
    };
  }

  /** Infere tipo de chave PIX pelo formato (CPF 11, CNPJ 14, caso contrário EMAIL). */
  private inferPixKeyType(key: string): AsaasPixKeyType {
    const digits = key.replace(/\D/g, "");
    if (digits.length === 11) return "CPF";
    if (digits.length === 14) return "CNPJ";
    if (/^\d+$/.test(key) && key.length >= 10 && key.length <= 11)
      return "PHONE";
    return "EMAIL";
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
