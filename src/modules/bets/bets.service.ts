import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { GameConfigService } from '../game/game-config.service';
import { RoundsService } from '../rounds/rounds.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { BetModality, BetStatus } from '@prisma/client';

/**
 * 🎲 BETS SERVICE
 * 
 * Serviço responsável por validação e criação de apostas
 * Implementa validações específicas para cada modalidade
 */

@Injectable()
export class BetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameConfig: GameConfigService,
    private readonly roundsService: RoundsService,
    private readonly walletsService: WalletsService,
  ) {}

  /**
   * Cria uma nova aposta com validações completas
   */
  async create(userId: string, createBetDto: CreateBetDto) {
    // 1. Validar rodada existe e está aberta
    const draw = await this.prisma.draw.findUnique({
      where: { id: createBetDto.drawId },
    });

    if (!draw || draw.deletedAt) {
      throw new NotFoundException('Rodada não encontrada');
    }

    // 2. Verificar se ainda pode apostar (cutoff)
    const canBet = await this.roundsService.isOpenForBets(createBetDto.drawId);
    if (!canBet) {
      throw new ConflictException(
        `Apostas para esta rodada foram encerradas. Cutoff: ${draw.cutoffAt.toISOString()}`,
      );
    }

    // 3. Validar campos específicos da modalidade
    await this.validateBetByModality(createBetDto);

    // 4. Verificar saldo do usuário
    const wallet = await this.walletsService.findOrCreateByUserId(userId);
    if (wallet.balance < createBetDto.amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponível: R$ ${wallet.balance.toFixed(2)}`,
      );
    }

    // 5. Validar que todos os teamIds existem na tabela Team (evita FK violation)
    if (createBetDto.teamIds && createBetDto.teamIds.length > 0) {
      const existingTeams = await this.prisma.team.findMany({
        where: { id: { in: createBetDto.teamIds }, deletedAt: null },
        select: { id: true },
      });
      const existingIds = new Set(existingTeams.map((t) => t.id));
      const invalidIds = createBetDto.teamIds.filter((id) => !existingIds.has(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Times não encontrados (IDs inválidos: ${invalidIds.join(', ')}). Use os times retornados por GET /teams.`,
        );
      }
    }

    // 6. Obter multiplicador da modalidade
    const multiplier = this.gameConfig.getMultiplierForModality(createBetDto.modality);

    // 7. Criar a aposta dentro de uma transação
    const bet = await this.prisma.$transaction(async (prisma) => {
      // Criar a aposta
      const newBet = await prisma.bet.create({
        data: {
          userId,
          drawId: createBetDto.drawId,
          modality: createBetDto.modality,
          amount: createBetDto.amount,
          multiplier,
          status: BetStatus.PENDING,
          jerseys: this.extractJerseys(createBetDto),
        },
      });

      // Associar times (se aplicável)
      if (createBetDto.teamIds && createBetDto.teamIds.length > 0) {
        await prisma.betTeam.createMany({
          data: createBetDto.teamIds.map((teamId) => ({
            betId: newBet.id,
            teamId,
          })),
        });
      }

      // Debitar da carteira
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: createBetDto.amount,
          },
        },
      });

      // Criar transação
      await prisma.transaction.create({
        data: {
          userId,
          type: 'BET',
          amount: -createBetDto.amount,
          description: `Aposta ${this.getModalityName(createBetDto.modality)} - Rodada ${draw.scheduledAt.toISOString()}`,
          status: 'COMPLETED',
          betId: newBet.id,
        },
      });

      return newBet;
    });

    // 7. Retornar aposta com dados completos
    return this.findOne(bet.id);
  }

  /**
   * Valida os campos específicos de cada modalidade
   */
  private async validateBetByModality(dto: CreateBetDto): Promise<void> {
    switch (dto.modality) {
      case BetModality.TIME:
        this.validateTimeModality(dto);
        break;

      case BetModality.CAMISA:
        this.validateCamisaModality(dto);
        break;

      case BetModality.DUPLA:
        this.validateDuplaModality(dto);
        break;

      case BetModality.TERNO:
        this.validateTernoModality(dto);
        break;

      case BetModality.PASSE:
        await this.validatePasseModality(dto);
        break;

      case BetModality.CENTENA:
        this.validateCentenaModality(dto);
        break;

      case BetModality.MILHAR:
        this.validateMilharModality(dto);
        break;

      default:
        throw new BadRequestException('Modalidade de aposta inválida');
    }
  }

  /**
   * TIME: Escolher 1 time
   * (existência do ID é validada depois contra a tabela Team)
   */
  private validateTimeModality(dto: CreateBetDto): void {
    if (!dto.teamIds || dto.teamIds.length !== 1) {
      throw new BadRequestException('Modalidade TIME requer exatamente 1 time');
    }
  }

  /**
   * CAMISA: Escolher 1 dezena (00..99)
   */
  private validateCamisaModality(dto: CreateBetDto): void {
    if (!dto.jerseys || dto.jerseys.length !== 1) {
      throw new BadRequestException('Modalidade CAMISA requer exatamente 1 número');
    }

    const jersey = dto.jerseys[0];
    if (jersey < 0 || jersey > 99) {
      throw new BadRequestException('Número da camisa deve estar entre 0 e 99');
    }
  }

  /**
   * DUPLA: Escolher 2 times distintos
   */
  private validateDuplaModality(dto: CreateBetDto): void {
    if (!dto.teamIds || dto.teamIds.length !== 2) {
      throw new BadRequestException('Modalidade DUPLA requer exatamente 2 times');
    }

    const [team1, team2] = dto.teamIds;

    if (team1 === team2) {
      throw new BadRequestException('Os dois times devem ser diferentes');
    }
  }

  /**
   * TERNO: Escolher 3 times distintos
   */
  private validateTernoModality(dto: CreateBetDto): void {
    if (!dto.teamIds || dto.teamIds.length !== 3) {
      throw new BadRequestException('Modalidade TERNO requer exatamente 3 times');
    }

    const uniqueTeams = new Set(dto.teamIds);
    if (uniqueTeams.size !== 3) {
      throw new BadRequestException('Os 3 times devem ser diferentes');
    }
  }

  /**
   * PASSE: Escolher 1 time e 1 dezena que pertence a ele.
   * Usa as camisas do time no banco (não exige id 1-25).
   */
  private async validatePasseModality(dto: CreateBetDto): Promise<void> {
    if (!dto.teamIds || dto.teamIds.length !== 1) {
      throw new BadRequestException('Modalidade PASSE requer exatamente 1 time');
    }

    if (!dto.jerseys || dto.jerseys.length !== 1) {
      throw new BadRequestException('Modalidade PASSE requer exatamente 1 número');
    }

    const teamId = dto.teamIds[0];
    const jersey = dto.jerseys[0];

    if (jersey < 0 || jersey > 99) {
      throw new BadRequestException('Número deve estar entre 0 e 99');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, jerseys: true, name: true, deletedAt: true },
    });

    if (!team || team.deletedAt) {
      throw new BadRequestException(`Time com ID ${teamId} não encontrado`);
    }

    if (!team.jerseys.includes(jersey)) {
      throw new BadRequestException(
        `O número ${jersey} não pertence ao time ${team.name}. Números válidos: ${team.jerseys.join(', ')}`,
      );
    }
  }

  /**
   * CENTENA: Escolher 000..999
   */
  private validateCentenaModality(dto: CreateBetDto): void {
    if (dto.centena === undefined || dto.centena === null) {
      throw new BadRequestException('Modalidade CENTENA requer um número de 0 a 999');
    }

    if (dto.centena < 0 || dto.centena > 999) {
      throw new BadRequestException('Centena deve estar entre 0 e 999');
    }
  }

  /**
   * MILHAR: Escolher 0000..9999
   */
  private validateMilharModality(dto: CreateBetDto): void {
    if (dto.milhar === undefined || dto.milhar === null) {
      throw new BadRequestException('Modalidade MILHAR requer um número de 0 a 9999');
    }

    if (dto.milhar < 0 || dto.milhar > 9999) {
      throw new BadRequestException('Milhar deve estar entre 0 e 9999');
    }
  }

  /**
   * Extrai os números (jerseys) apostados para armazenar no banco
   */
  private extractJerseys(dto: CreateBetDto): number[] {
    switch (dto.modality) {
      case BetModality.CAMISA:
      case BetModality.PASSE:
        return dto.jerseys || [];

      case BetModality.CENTENA:
        return dto.centena !== undefined ? [dto.centena] : [];

      case BetModality.MILHAR:
        return dto.milhar !== undefined ? [dto.milhar] : [];

      default:
        return [];
    }
  }

  /**
   * Nome amigável da modalidade
   */
  private getModalityName(modality: BetModality): string {
    const names = {
      [BetModality.TIME]: 'Time da Sorte',
      [BetModality.CAMISA]: 'Camisa',
      [BetModality.DUPLA]: 'Dupla de Times',
      [BetModality.TERNO]: 'Terno',
      [BetModality.PASSE]: 'Passe',
      [BetModality.CENTENA]: 'Centena',
      [BetModality.MILHAR]: 'Milhar',
    };
    return names[modality] || modality;
  }

  /**
   * Busca uma aposta por ID com todos os dados
   */
  async findOne(id: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teams: {
          include: {
            team: true,
          },
        },
        draw: {
          select: {
            id: true,
            scheduledAt: true,
            cutoffAt: true,
            status: true,
            milhares: true,
            jerseys: true,
            teams: true,
          },
        },
        settlement: true,
      },
    });

    if (!bet || bet.deletedAt) {
      throw new NotFoundException('Aposta não encontrada');
    }

    return {
      ...bet,
      expectedReturn: bet.amount * (bet.multiplier || 0),
    };
  }

  /**
   * Lista apostas do usuário com filtros
   */
  async findByUser(userId: string, page = 1, limit = 20, status?: BetStatus) {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
      ...(status && { status }),
    };

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          teams: {
            include: {
              team: true,
            },
          },
          draw: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.bet.count({ where }),
    ]);

    const betsWithReturn = bets.map((bet) => ({
      ...bet,
      expectedReturn: bet.amount * (bet.multiplier || 0),
    }));

    return {
      data: betsWithReturn,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lista apostas de uma rodada (Admin)
   */
  async findByDraw(drawId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: {
          drawId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          teams: {
            include: {
              team: true,
            },
          },
        },
      }),
      this.prisma.bet.count({
        where: {
          drawId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: bets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancela uma aposta (antes do cutoff)
   */
  async cancel(betId: string, userId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        draw: true,
      },
    });

    if (!bet || bet.deletedAt) {
      throw new NotFoundException('Aposta não encontrada');
    }

    if (bet.userId !== userId) {
      throw new BadRequestException('Você não pode cancelar esta aposta');
    }

    if (bet.status !== BetStatus.PENDING) {
      throw new BadRequestException('Apenas apostas pendentes podem ser canceladas');
    }

    if (!bet.draw) {
      throw new BadRequestException('Rodada associada não encontrada');
    }

    // Verificar se ainda está antes do cutoff
    if (new Date() >= bet.draw.cutoffAt) {
      throw new ConflictException('Não é possível cancelar após o cutoff');
    }

    // Cancelar e reembolsar
    await this.prisma.$transaction(async (prisma) => {
      // Atualizar status
      await prisma.bet.update({
        where: { id: betId },
        data: {
          status: BetStatus.CANCELLED,
        },
      });

      // Reembolsar carteira
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: bet.amount,
          },
        },
      });

      // Criar transação de reembolso
      await prisma.transaction.create({
        data: {
          userId,
          type: 'REFUND',
          amount: bet.amount,
          description: `Reembolso de aposta cancelada`,
          status: 'COMPLETED',
          betId: betId,
        },
      });
    });

    return {
      message: 'Aposta cancelada e valor reembolsado',
      refundAmount: bet.amount,
    };
  }
}
