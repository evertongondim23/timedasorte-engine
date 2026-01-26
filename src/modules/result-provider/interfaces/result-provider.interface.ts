import { ResultSource } from '@prisma/client';

/**
 * 🔌 RESULT PROVIDER INTERFACE
 * 
 * Interface para provedores plugáveis de resultados
 */

export interface DrawResultData {
  milhares: number[];
  source: ResultSource;
  externalRef?: string;
  fetchedAt: Date;
}

export interface IResultProvider {
  /**
   * Nome identificador do provider
   */
  getName(): string;

  /**
   * Verifica se o provider está disponível/configurado
   */
  isAvailable(): Promise<boolean>;

  /**
   * Busca o resultado de um sorteio agendado
   * 
   * @param scheduledAt Data/hora do sorteio agendado
   * @returns Dados do resultado ou null se não disponível ainda
   */
  fetchResult(scheduledAt: Date): Promise<DrawResultData | null>;

  /**
   * Valida se um resultado é válido
   * 
   * @param milhares Array com 5 milhares
   */
  validateResult(milhares: number[]): boolean;
}
