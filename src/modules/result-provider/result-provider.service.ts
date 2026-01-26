import { Injectable, Logger } from '@nestjs/common';
import { AdminProvider } from './providers/admin.provider';
import { OfficialProvider } from './providers/official.provider';
import { IResultProvider } from './interfaces/result-provider.interface';

/**
 * 🔌 RESULT PROVIDER SERVICE
 * 
 * Serviço que gerencia os provedores de resultado disponíveis
 */

@Injectable()
export class ResultProviderService {
  private readonly logger = new Logger(ResultProviderService.name);
  private readonly providers: Map<string, IResultProvider> = new Map();

  constructor(
    private readonly adminProvider: AdminProvider,
    private readonly officialProvider: OfficialProvider,
  ) {
    // Registrar providers disponíveis
    this.registerProvider(adminProvider);
    this.registerProvider(officialProvider);
  }

  /**
   * Registra um provider
   */
  private registerProvider(provider: IResultProvider): void {
    this.providers.set(provider.getName(), provider);
    this.logger.log(`✅ Provider registrado: ${provider.getName()}`);
  }

  /**
   * Obtém um provider pelo nome
   */
  getProvider(name: string): IResultProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Lista todos os providers disponíveis
   */
  async listProviders(): Promise<Array<{ name: string; available: boolean }>> {
    const list: Array<{ name: string; available: boolean }> = [];

    for (const [name, provider] of this.providers.entries()) {
      const available = await provider.isAvailable();
      list.push({ name, available });
    }

    return list;
  }

  /**
   * Tenta buscar resultado de um provider específico
   */
  async fetchFromProvider(providerName: string, scheduledAt: Date) {
    const provider = this.getProvider(providerName);

    if (!provider) {
      this.logger.error(`Provider ${providerName} não encontrado`);
      return null;
    }

    const available = await provider.isAvailable();
    if (!available) {
      this.logger.warn(`Provider ${providerName} não está disponível`);
      return null;
    }

    return await provider.fetchResult(scheduledAt);
  }

  /**
   * Tenta buscar resultado de todos os providers (fallback)
   */
  async fetchFromAnyProvider(scheduledAt: Date) {
    // Tentar primeiro o official provider
    const officialResult = await this.fetchFromProvider('OFFICIAL', scheduledAt);
    if (officialResult) {
      return officialResult;
    }

    // Se não houver resultado oficial, não há fallback
    // Admin provider não busca resultados automaticamente
    return null;
  }

  /**
   * Valida um resultado usando o provider
   */
  validateResult(providerName: string, milhares: number[]): boolean {
    const provider = this.getProvider(providerName);

    if (!provider) {
      this.logger.error(`Provider ${providerName} não encontrado`);
      return false;
    }

    return provider.validateResult(milhares);
  }
}
