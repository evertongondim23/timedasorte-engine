import { Injectable } from '@nestjs/common';
import { ResultSource, RoundCategory } from '@prisma/client';
import { IResultProvider, DrawResultData } from '../interfaces/result-provider.interface';

/**
 * 🛡️ ADMIN PROVIDER
 * 
 * Provider para entrada manual de resultados por administradores
 * Este provider não busca resultados, apenas valida
 */

@Injectable()
export class AdminProvider implements IResultProvider {
  getName(): string {
    return 'ADMIN';
  }

  async isAvailable(): Promise<boolean> {
    // Admin provider está sempre disponível
    return true;
  }

  async fetchResult(scheduledAt: Date, category?: RoundCategory): Promise<DrawResultData | null> {
    // Admin provider não busca resultados automaticamente
    // Resultados são inseridos manualmente via API
    return null;
  }

  validateResult(milhares: number[]): boolean {
    // Validar formato
    if (!Array.isArray(milhares) || milhares.length !== 5) {
      return false;
    }

    // Validar que todos são números entre 0 e 9999
    return milhares.every((milhar) => {
      return (
        typeof milhar === 'number' &&
        Number.isInteger(milhar) &&
        milhar >= 0 &&
        milhar <= 9999
      );
    });
  }
}
