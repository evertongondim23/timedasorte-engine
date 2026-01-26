import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { GameConfigService } from '../game/game-config.service';
import { BetModality, BetStatus, DrawStatus } from '@prisma/client';

/**
 * 📊 RESULTS SERVICE
 * 
 * Serviço responsável por calcular vencedores e processar payouts
 * após a publicação de um resultado
 */

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gameConfig: GameConfigService,
  ) {}

  /**
   * Processa todas as apostas de uma rodada após publicação do resultado
   */
  async processDrawBets(drawId: string) {
    this.logger.log(`🎰 Iniciando processamento de apostas para rodada ${drawId}`);

    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      throw new Error(`Rodada ${drawId} não encontrada`);
    }

    if (draw.status !== DrawStatus.IN_PROGRESS) {
      throw new Error(`Rodada ${drawId} não está em IN_PROGRESS`);
    }

    // Buscar todas as apostas pendentes da rodada
    const bets = await this.prisma.bet.findMany({
      where: {
        drawId,
        status: BetStatus.PENDING,
        deletedAt: null,
      },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    this.logger.log(`📋 Encontradas ${bets.length} apostas para processar`);

    let winnersCount = 0;
    let totalPrizesPaid = 0;

    // Processar cada aposta
    for (const bet of bets) {
      try {
        const { isWinner, matchedItems, prizeAmount } = await this.evaluateBet(bet, draw);

        // Criar settlement
        await this.prisma.settlement.create({
          data: {
            betId: bet.id,
            drawId,
            resultSnapshot: {
              milhares: draw.milhares,
              jerseys: draw.jerseys,
              teams: draw.teams,
            },
            isWinner,
            matchedItems,
            prizeAmount,
            multiplier: bet.multiplier || 0,
            computedBy: 'SYSTEM',
          },
        });

        // Atualizar status da aposta
        await this.prisma.bet.update({
          where: { id: bet.id },
          data: {
            status: isWinner ? BetStatus.WON : BetStatus.LOST,
            prize: isWinner ? prizeAmount : 0,
            isWinner,
            winningReason: isWinner ? `Acertou: ${matchedItems.join(', ')}` : undefined,
            processedAt: new Date(),
          },
        });

        // Se vencedor, creditar prêmio na carteira
        if (isWinner) {
          await this.creditPrize(bet.userId, prizeAmount, drawId);
          winnersCount++;
          totalPrizesPaid += prizeAmount;
        }

        this.logger.debug(`✅ Aposta ${bet.id}: ${isWinner ? '🏆 VENCEDORA' : '❌ Perdedora'}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao processar aposta ${bet.id}:`, error);
      }
    }

    // Atualizar estatísticas da rodada
    await this.prisma.draw.update({
      where: { id: drawId },
      data: {
        status: DrawStatus.COMPLETED,
        totalBets: bets.length,
        totalPrizePool: bets.reduce((sum, bet) => sum + bet.amount, 0),
        totalWinners: winnersCount,
        totalPrizesPaid,
      },
    });

    this.logger.log(`✨ Processamento concluído: ${winnersCount} vencedores, R$ ${totalPrizesPaid.toFixed(2)} pagos`);

    return {
      totalBets: bets.length,
      totalWinners: winnersCount,
      totalPrizesPaid,
    };
  }

  /**
   * Avalia uma aposta específica contra um resultado
   */
  private async evaluateBet(bet: any, draw: any): Promise<{ isWinner: boolean; matchedItems: string[]; prizeAmount: number }> {
    const { milhares, jerseys, teams } = draw;

    let isWinner = false;
    let matchedItems: string[] = [];

    switch (bet.modality) {
      case BetModality.TIME:
        ({ isWinner, matchedItems } = this.evaluateTime(bet, teams));
        break;

      case BetModality.CAMISA:
        ({ isWinner, matchedItems } = this.evaluateCamisa(bet, jerseys));
        break;

      case BetModality.DUPLA:
        ({ isWinner, matchedItems } = this.evaluateDupla(bet, teams));
        break;

      case BetModality.TERNO:
        ({ isWinner, matchedItems } = this.evaluateTerno(bet, teams));
        break;

      case BetModality.PASSE:
        ({ isWinner, matchedItems } = this.evaluatePasse(bet, jerseys, teams));
        break;

      case BetModality.CENTENA:
        ({ isWinner, matchedItems } = this.evaluateCentena(bet, milhares));
        break;

      case BetModality.MILHAR:
        ({ isWinner, matchedItems } = this.evaluateMilhar(bet, milhares));
        break;
    }

    const prizeAmount = isWinner ? bet.amount * (bet.multiplier || 0) : 0;

    return { isWinner, matchedItems, prizeAmount };
  }

  /**
   * TIME: Ganha se o time apostado aparece entre os 5 times sorteados
   */
  private evaluateTime(bet: any, sortedTeams: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betTeamId = bet.teams[0]?.teamId;
    const isWinner = sortedTeams.includes(betTeamId);
    const matchedItems = isWinner ? [`Time ${betTeamId}`] : [];
    return { isWinner, matchedItems };
  }

  /**
   * CAMISA: Ganha se a dezena apostada aparece entre as 5 dezenas sorteadas
   */
  private evaluateCamisa(bet: any, sortedJerseys: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betJersey = bet.jerseys[0];
    const isWinner = sortedJerseys.includes(betJersey);
    const matchedItems = isWinner ? [`Dezena ${betJersey}`] : [];
    return { isWinner, matchedItems };
  }

  /**
   * DUPLA: Ganha se AMBOS os times apostados aparecem
   */
  private evaluateDupla(bet: any, sortedTeams: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betTeamIds = bet.teams.map((t: any) => t.teamId);
    const matchedTeams = betTeamIds.filter((id: number) => sortedTeams.includes(id));
    const isWinner = matchedTeams.length === 2;
    const matchedItems = matchedTeams.map((id: number) => `Time ${id}`);
    return { isWinner, matchedItems };
  }

  /**
   * TERNO: Ganha se TODOS os 3 times apostados aparecem
   */
  private evaluateTerno(bet: any, sortedTeams: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betTeamIds = bet.teams.map((t: any) => t.teamId);
    const matchedTeams = betTeamIds.filter((id: number) => sortedTeams.includes(id));
    const isWinner = matchedTeams.length === 3;
    const matchedItems = matchedTeams.map((id: number) => `Time ${id}`);
    return { isWinner, matchedItems };
  }

  /**
   * PASSE: Ganha se a dezena aparece E pertence ao time apostado
   */
  private evaluatePasse(bet: any, sortedJerseys: number[], sortedTeams: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betTeamId = bet.teams[0]?.teamId;
    const betJersey = bet.jerseys[0];

    // Verificar se a dezena apareceu
    const jerseyMatched = sortedJerseys.includes(betJersey);

    // Verificar se o time apareceu
    const teamMatched = sortedTeams.includes(betTeamId);

    // Ganha se ambos aparecem
    const isWinner = jerseyMatched && teamMatched;
    const matchedItems = isWinner ? [`Time ${betTeamId}`, `Dezena ${betJersey}`] : [];

    return { isWinner, matchedItems };
  }

  /**
   * CENTENA: Ganha se os últimos 3 dígitos de algum milhar baterem
   */
  private evaluateCentena(bet: any, sortedMilhares: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betCentena = bet.jerseys[0]; // Centena armazenada em jerseys

    for (const milhar of sortedMilhares) {
      const centena = this.gameConfig.milharToCentena(milhar);
      if (centena === betCentena) {
        return {
          isWinner: true,
          matchedItems: [`Centena ${betCentena} (do milhar ${milhar})`],
        };
      }
    }

    return { isWinner: false, matchedItems: [] };
  }

  /**
   * MILHAR: Ganha se algum milhar exato foi sorteado
   */
  private evaluateMilhar(bet: any, sortedMilhares: number[]): { isWinner: boolean; matchedItems: string[] } {
    const betMilhar = bet.jerseys[0]; // Milhar armazenado em jerseys
    const isWinner = sortedMilhares.includes(betMilhar);
    const matchedItems = isWinner ? [`Milhar ${betMilhar}`] : [];
    return { isWinner, matchedItems };
  }

  /**
   * Credita prêmio na carteira do vencedor
   */
  private async creditPrize(userId: string, prizeAmount: number, drawId: string) {
    await this.prisma.$transaction(async (prisma) => {
      // Atualizar carteira
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error(`Carteira não encontrada para usuário ${userId}`);
      }

      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: prizeAmount,
          },
        },
      });

      // Criar transação de prêmio
      await prisma.transaction.create({
        data: {
          userId,
          type: 'PRIZE',
          amount: prizeAmount,
          description: `Prêmio da rodada ${drawId}`,
          status: 'COMPLETED',
        },
      });
    });
  }
}
