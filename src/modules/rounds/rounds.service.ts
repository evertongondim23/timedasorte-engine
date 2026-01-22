import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma/prisma.service';
import { GameConfigService } from '../game/game-config.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { PublishResultDto } from './dto/publish-result.dto';
import { DrawStatus, ResultSource } from '@prisma/client';

/**
 * 🎰 ROUNDS SERVICE
 * 
 * Serviço responsável por gerenciar rodadas (draws) do jogo:
 * - Criação de rodadas
 * - Publicação de resultados
 * - Bloqueio de apostas (cutoff)
 * - Consulta de rodadas
 */

@Injectable()
export class RoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameConfig: GameConfigService,
  ) {}

  /**
   * Cria uma nova rodada
   */
  async create(createRoundDto: CreateRoundDto) {
    const scheduledAt = new Date(createRoundDto.scheduledAt);
    
    // Validar que a data é futura
    if (scheduledAt <= new Date()) {
      throw new BadRequestException(
        'A data agendada deve ser no futuro',
      );
    }

    // Calcular o cutoff (30 minutos antes)
    const cutoffAt = this.gameConfig.calculateCutoffTime(scheduledAt);

    // Verificar se já existe uma rodada para esse horário
    const existing = await this.prisma.draw.findFirst({
      where: {
        scheduledAt,
        deletedAt: null,
        status: {
          not: DrawStatus.CANCELLED,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Já existe uma rodada agendada para ${scheduledAt.toISOString()}`,
      );
    }

    // Criar a rodada
    const draw = await this.prisma.draw.create({
      data: {
        scheduledAt,
        cutoffAt,
        status: DrawStatus.OPEN,
        source: ResultSource.ADMIN,
        externalRef: createRoundDto.externalRef,
        milhares: [],
        jerseys: [],
        teams: [],
      },
    });

    return {
      ...draw,
      canPlaceBet: this.gameConfig.canPlaceBet(draw.cutoffAt),
      minutesToCutoff: Math.floor(
        (draw.cutoffAt.getTime() - Date.now()) / 60000,
      ),
    };
  }

  /**
   * Busca a próxima rodada disponível para apostas
   */
  async getNext() {
    const now = new Date();

    const draw = await this.prisma.draw.findFirst({
      where: {
        cutoffAt: {
          gt: now, // Cutoff ainda não passou
        },
        status: {
          in: [DrawStatus.SCHEDULED, DrawStatus.OPEN],
        },
        deletedAt: null,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    if (!draw) {
      return null;
    }

    return {
      ...draw,
      canPlaceBet: this.gameConfig.canPlaceBet(draw.cutoffAt),
      minutesToCutoff: Math.floor(
        (draw.cutoffAt.getTime() - Date.now()) / 60000,
      ),
    };
  }

  /**
   * Busca uma rodada por ID
   */
  async findOne(id: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            bets: true,
          },
        },
      },
    });

    if (!draw) {
      throw new NotFoundException(`Rodada ${id} não encontrada`);
    }

    return {
      ...draw,
      canPlaceBet: this.gameConfig.canPlaceBet(draw.cutoffAt),
      minutesToCutoff: Math.floor(
        (draw.cutoffAt.getTime() - Date.now()) / 60000,
      ),
    };
  }

  /**
   * Busca o resultado de uma rodada
   */
  async getResult(id: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id, deletedAt: null },
    });

    if (!draw) {
      throw new NotFoundException(`Rodada ${id} não encontrada`);
    }

    if (draw.status === DrawStatus.OPEN || draw.status === DrawStatus.CLOSED) {
      throw new BadRequestException(
        'O resultado desta rodada ainda não foi publicado',
      );
    }

    return {
      id: draw.id,
      scheduledAt: draw.scheduledAt,
      publishedAt: draw.publishedAt,
      executedAt: draw.executedAt,
      status: draw.status,
      source: draw.source,
      externalRef: draw.externalRef,
      milhares: draw.milhares,
      jerseys: draw.jerseys,
      teams: draw.teams,
      totalBets: draw.totalBets,
      totalPrizePool: draw.totalPrizePool,
      totalWinners: draw.totalWinners,
      totalPrizesPaid: draw.totalPrizesPaid,
    };
  }

  /**
   * Lista rodadas com paginação
   */
  async findAll(page = 1, limit = 10, status?: DrawStatus) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status && { status }),
    };

    const [draws, total] = await Promise.all([
      this.prisma.draw.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledAt: 'desc',
        },
        include: {
          _count: {
            select: {
              bets: true,
            },
          },
        },
      }),
      this.prisma.draw.count({ where }),
    ]);

    const drawsWithMeta = draws.map((draw) => ({
      ...draw,
      canPlaceBet: this.gameConfig.canPlaceBet(draw.cutoffAt),
      minutesToCutoff: Math.floor(
        (draw.cutoffAt.getTime() - Date.now()) / 60000,
      ),
    }));

    return {
      data: drawsWithMeta,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Publica o resultado de uma rodada
   * 
   * Esta é a operação crítica que:
   * 1. Valida os milhares
   * 2. Calcula dezenas e times
   * 3. Fecha a rodada para apostas
   * 4. Aciona o cálculo de vencedores (via evento ou service)
   */
  async publishResult(id: string, publishResultDto: PublishResultDto) {
    const draw = await this.prisma.draw.findUnique({
      where: { id, deletedAt: null },
    });

    if (!draw) {
      throw new NotFoundException(`Rodada ${id} não encontrada`);
    }

    if (draw.status === DrawStatus.COMPLETED) {
      throw new ConflictException(
        'Esta rodada já foi finalizada e não pode ser alterada',
      );
    }

    // Processar os milhares e extrair dezenas/times
    const result = this.gameConfig.processDrawResult(publishResultDto.milhares);

    // Atualizar a rodada com o resultado
    const updatedDraw = await this.prisma.draw.update({
      where: { id },
      data: {
        milhares: result.milhares,
        jerseys: result.jerseys,
        teams: result.teams,
        status: DrawStatus.IN_PROGRESS,
        publishedAt: new Date(),
        executedAt: new Date(),
        source: publishResultDto.source || draw.source,
        externalRef: publishResultDto.externalRef || draw.externalRef,
      },
    });

    return {
      ...updatedDraw,
      message: 'Resultado publicado com sucesso. Processamento de apostas iniciado.',
    };
  }

  /**
   * Fecha automaticamente rodadas cujo cutoff já passou
   * (Deve ser executado por um cron job)
   */
  async closeExpiredRounds() {
    const now = new Date();

    const result = await this.prisma.draw.updateMany({
      where: {
        cutoffAt: {
          lt: now,
        },
        status: DrawStatus.OPEN,
        deletedAt: null,
      },
      data: {
        status: DrawStatus.CLOSED,
      },
    });

    return {
      closed: result.count,
      message: `${result.count} rodada(s) fechada(s) automaticamente`,
    };
  }

  /**
   * Cancela uma rodada
   */
  async cancel(id: string, reason?: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id, deletedAt: null },
    });

    if (!draw) {
      throw new NotFoundException(`Rodada ${id} não encontrada`);
    }

    if (draw.status === DrawStatus.COMPLETED) {
      throw new ConflictException(
        'Não é possível cancelar uma rodada finalizada',
      );
    }

    // Cancelar a rodada
    const updated = await this.prisma.draw.update({
      where: { id },
      data: {
        status: DrawStatus.CANCELLED,
      },
    });

    // TODO: Reembolsar apostas vinculadas a essa rodada

    return {
      ...updated,
      message: `Rodada cancelada. ${reason || 'Sem motivo especificado'}.`,
    };
  }

  /**
   * Verifica se uma rodada está aberta para apostas
   */
  async isOpenForBets(drawId: string): Promise<boolean> {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId, deletedAt: null },
      select: { cutoffAt: true, status: true },
    });

    if (!draw) {
      return false;
    }

    if (draw.status !== DrawStatus.OPEN) {
      return false;
    }

    return this.gameConfig.canPlaceBet(draw.cutoffAt);
  }
}
