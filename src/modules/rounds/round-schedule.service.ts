import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { RoundCategory, DrawStatus, ResultSource } from '@prisma/client';
import { GameConfigService } from '../game/game-config.service';

/**
 * 🕐 ROUND SCHEDULE SERVICE
 * 
 * Gerencia a grade fixa de horários e geração automática de rodadas
 * 
 * Grade (Seg-Sex):
 * - PTM: 11:00
 * - PPT: 14:00
 * - PT: 16:00
 * - PTV: 18:00
 * - PTN: 21:00
 * - COR: 00:30 (próximo dia)
 */

interface RoundSchedule {
  category: RoundCategory;
  hour: number;
  minute: number;
  isNextDay?: boolean; // Para COR que é 00:30 do próximo dia
}

@Injectable()
export class RoundScheduleService {
  private readonly logger = new Logger(RoundScheduleService.name);

  // Grade fixa de horários (ajustável)
  private readonly schedule: RoundSchedule[] = [
    { category: RoundCategory.PTM, hour: 11, minute: 0 },
    { category: RoundCategory.PPT, hour: 14, minute: 0 },
    { category: RoundCategory.PT, hour: 16, minute: 0 },
    { category: RoundCategory.PTV, hour: 18, minute: 0 },
    { category: RoundCategory.PTN, hour: 21, minute: 0 },
    { category: RoundCategory.COR, hour: 0, minute: 30, isNextDay: true },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly gameConfig: GameConfigService,
  ) {}

  /**
   * Gera todas as rodadas para um dia específico (Seg-Sex)
   */
  async generateRoundsForDate(date: Date): Promise<void> {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

    // Não gerar rodadas para domingo e sábado (apenas Seg-Sex)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return;
    }

    for (const scheduleItem of this.schedule) {
      const scheduledAt = this.calculateScheduledAt(date, scheduleItem);
      const cutoffAt = this.gameConfig.calculateCutoffTime(scheduledAt);

      // Verificar se já existe rodada para este horário
      const existing = await this.prisma.draw.findFirst({
        where: {
          category: scheduleItem.category,
          scheduledAt: {
            gte: new Date(scheduledAt.getTime() - 60000), // -1 minuto
            lte: new Date(scheduledAt.getTime() + 60000), // +1 minuto
          },
          deletedAt: null,
        },
      });

      if (!existing) {
        await this.prisma.draw.create({
          data: {
            category: scheduleItem.category,
            scheduledAt,
            cutoffAt,
            status: this.calculateStatus(scheduledAt, cutoffAt),
            source: ResultSource.OFFICIAL,
            milhares: [],
            jerseys: [],
            teams: [],
          },
        });
      }
    }
  }

  /**
   * Gera rodadas para os próximos N dias
   */
  async generateRoundsForNextDays(days: number = 7): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      await this.generateRoundsForDate(date);
    }
  }

  /**
   * Calcula o scheduledAt baseado na data e no schedule item
   */
  private calculateScheduledAt(date: Date, schedule: RoundSchedule): Date {
    const scheduledAt = new Date(date);

    if (schedule.isNextDay) {
      // COR: 00:30 do próximo dia
      scheduledAt.setDate(date.getDate() + 1);
      scheduledAt.setHours(schedule.hour, schedule.minute, 0, 0);
    } else {
      scheduledAt.setHours(schedule.hour, schedule.minute, 0, 0);
    }

    return scheduledAt;
  }

  /**
   * Calcula o status inicial da rodada baseado no horário atual
   */
  private calculateStatus(scheduledAt: Date, cutoffAt: Date): DrawStatus {
    const now = new Date();

    if (now < cutoffAt) {
      return DrawStatus.OPEN;
    } else if (now < scheduledAt) {
      return DrawStatus.CLOSED;
    } else {
      return DrawStatus.PENDING_RESULT;
    }
  }

  /**
   * Retorna a próxima rodada disponível (status OPEN)
   */
  async getNextAvailableRound(): Promise<any | null> {
    const now = new Date();

    const round = await this.prisma.draw.findFirst({
      where: {
        status: DrawStatus.OPEN,
        cutoffAt: {
          gt: now,
        },
        deletedAt: null,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    if (!round) {
      return null;
    }

    return {
      ...round,
      canPlaceBet: this.gameConfig.canPlaceBet(round.cutoffAt),
      minutesToCutoff: Math.floor(
        (round.cutoffAt.getTime() - now.getTime()) / 60000,
      ),
    };
  }

  /**
   * Retorna todas as rodadas disponíveis para o frontend
   */
  async getAvailableRoundsInfo(): Promise<{
    available: any | null;
    nextClosed: any | null;
    nextScheduled: any | null;
  }> {
    const now = new Date();

    // Próxima rodada OPEN (disponível para apostas)
    const available = await this.prisma.draw.findFirst({
      where: {
        status: DrawStatus.OPEN,
        cutoffAt: { gt: now },
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Próxima rodada CLOSED (aguardando resultado)
    const nextClosed = await this.prisma.draw.findFirst({
      where: {
        status: { in: [DrawStatus.CLOSED, DrawStatus.PENDING_RESULT] },
        scheduledAt: { gte: now },
        publishedAt: null,
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Próxima rodada agendada (ainda não abriu)
    const nextScheduled = await this.prisma.draw.findFirst({
      where: {
        status: DrawStatus.SCHEDULED,
        scheduledAt: { gt: now },
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const summary = {
      now: now.toISOString(),
      available: available
        ? { id: available.id, category: available.category, status: available.status }
        : null,
      nextClosed: nextClosed
        ? { id: nextClosed.id, category: nextClosed.category, status: nextClosed.status }
        : null,
      nextScheduled: nextScheduled
        ? {
            id: nextScheduled.id,
            category: nextScheduled.category,
            status: nextScheduled.status,
          }
        : null,
    };
    this.logger.log(
      `[GET /rounds/available] ${JSON.stringify(summary)} — se os três forem null, o front mostra "Nenhuma rodada disponível". (nextClosed exige scheduledAt >= now; sorteios já passados não entram.)`,
    );

    return {
      available: available
        ? {
            ...available,
            canPlaceBet: this.gameConfig.canPlaceBet(available.cutoffAt),
            minutesToCutoff: Math.floor(
              (available.cutoffAt.getTime() - now.getTime()) / 60000,
            ),
          }
        : null,
      nextClosed: nextClosed
        ? {
            ...nextClosed,
            minutesToResult: Math.floor(
              (nextClosed.scheduledAt.getTime() - now.getTime()) / 60000,
            ),
          }
        : null,
      nextScheduled: nextScheduled
        ? {
            ...nextScheduled,
            minutesUntilOpen: Math.floor(
              (nextScheduled.scheduledAt.getTime() - now.getTime()) / 60000,
            ),
          }
        : null,
    };
  }

  /**
   * Atualiza status de rodadas baseado no horário atual
   */
  async updateRoundsStatus(): Promise<void> {
    const now = new Date();

    // Atualizar rodadas que passaram do cutoff
    await this.prisma.draw.updateMany({
      where: {
        status: DrawStatus.OPEN,
        cutoffAt: { lte: now },
        deletedAt: null,
      },
      data: {
        status: DrawStatus.CLOSED,
      },
    });

    // Atualizar rodadas que passaram do scheduledAt mas não foram publicadas
    await this.prisma.draw.updateMany({
      where: {
        status: DrawStatus.CLOSED,
        scheduledAt: { lte: now },
        publishedAt: null,
        deletedAt: null,
      },
      data: {
        status: DrawStatus.PENDING_RESULT,
      },
    });
  }
}
