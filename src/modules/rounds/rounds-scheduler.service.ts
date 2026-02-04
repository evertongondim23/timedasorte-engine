import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoundScheduleService } from './round-schedule.service';
import { RoundsService } from './rounds.service';
import { DrawStatus } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

/**
 * ⏰ ROUNDS SCHEDULER SERVICE
 * 
 * Cron jobs para gerenciar rodadas automaticamente:
 * - Atualizar status das rodadas
 * - Gerar novas rodadas
 */

@Injectable()
export class RoundsSchedulerService {
  private readonly logger = new Logger(RoundsSchedulerService.name);

  constructor(
    private readonly scheduleService: RoundScheduleService,
    private readonly roundsService: RoundsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Atualiza status das rodadas a cada 5 minutos
   * OPEN → CLOSED → PENDING_RESULT
   */
  @Cron('*/5 * * * *', {
    name: 'updateRoundsStatus',
    timeZone: 'America/Sao_Paulo',
  })
  async handleUpdateRoundsStatus() {
    this.logger.log('🔄 Atualizando status das rodadas...');
    try {
      await this.scheduleService.updateRoundsStatus();
      this.logger.log('✅ Status das rodadas atualizado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar status das rodadas:', error);
    }
  }

  /**
   * Gera rodadas para os próximos 7 dias
   * Executa diariamente às 00:00 (meia-noite)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'generateRounds',
    timeZone: 'America/Sao_Paulo',
  })
  async handleGenerateRounds() {
    this.logger.log('🔄 Gerando rodadas para os próximos 7 dias...');
    try {
      await this.scheduleService.generateRoundsForNextDays(7);
      this.logger.log('✅ Rodadas geradas com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao gerar rodadas:', error);
    }
  }

  /**
   * Gera rodadas para os próximos 30 dias
   * Executa toda segunda-feira às 00:00
   */
  @Cron('0 0 * * 1', {
    name: 'generateRoundsWeekly',
    timeZone: 'America/Sao_Paulo',
  })
  async handleGenerateRoundsWeekly() {
    this.logger.log('🔄 Gerando rodadas para os próximos 30 dias (semanal)...');
    try {
      await this.scheduleService.generateRoundsForNextDays(30);
      this.logger.log('✅ Rodadas geradas com sucesso (semanal)');
    } catch (error) {
      this.logger.error('❌ Erro ao gerar rodadas (semanal):', error);
    }
  }

  /**
   * Busca resultados automaticamente para rodadas que estão no horário
   * Executa a cada 2 minutos
   * 
   * Busca resultados para rodadas que:
   * - Status: PENDING_RESULT (já passou o horário agendado)
   * - scheduledAt <= now
   * - publishedAt === null (ainda não foi publicado)
   */
  @Cron('*/2 * * * *', {
    name: 'fetchResults',
    timeZone: 'America/Sao_Paulo',
  })
  async handleFetchResults() {
    this.logger.log('🔍 Buscando resultados automaticamente...');
    
    try {
      const now = new Date();
      
      // Buscar rodadas que estão aguardando resultado
      const pendingRounds = await this.prisma.draw.findMany({
        where: {
          status: DrawStatus.PENDING_RESULT,
          scheduledAt: {
            lte: now, // Já passou o horário agendado
          },
          publishedAt: null, // Ainda não foi publicado
          deletedAt: null,
        },
        orderBy: {
          scheduledAt: 'asc', // Processar as mais antigas primeiro
        },
        take: 5, // Processar até 5 por vez para não sobrecarregar
      });

      if (pendingRounds.length === 0) {
        this.logger.debug('✅ Nenhuma rodada aguardando resultado');
        return;
      }

      this.logger.log(`📋 Encontradas ${pendingRounds.length} rodada(s) aguardando resultado`);

      // Tentar buscar e publicar resultado para cada rodada
      for (const round of pendingRounds) {
        try {
          this.logger.log(`🔍 Buscando resultado para rodada ${round.id} (${round.category})...`);
          
          const result = await this.roundsService.fetchAndPublishResult(round.id, 'OJOGODOBICHO');
          
          if (result) {
            this.logger.log(`✅ Resultado encontrado e publicado para rodada ${round.id}`);
          } else {
            this.logger.warn(`⚠️ Resultado não encontrado para rodada ${round.id}`);
          }
        } catch (error) {
          this.logger.error(`❌ Erro ao buscar resultado para rodada ${round.id}:`, error.message);
          // Continuar com as próximas rodadas mesmo se uma falhar
        }
      }

      this.logger.log('✅ Busca de resultados concluída');
    } catch (error) {
      this.logger.error('❌ Erro ao buscar resultados automaticamente:', error);
    }
  }
}
