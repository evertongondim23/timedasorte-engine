import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResultSource } from '@prisma/client';
import { IResultProvider, DrawResultData } from '../interfaces/result-provider.interface';

/**
 * 📡 OFFICIAL PROVIDER (STUB)
 * 
 * Provider para busca automática de resultados de fontes oficiais
 * 
 * ⚠️ IMPORTANTE: Este é um STUB/PLACEHOLDER
 * 
 * Para implementar integração com fonte oficial real:
 * 1. Configure variáveis de ambiente no .env:
 *    - OFFICIAL_PROVIDER_ENABLED=true
 *    - OFFICIAL_PROVIDER_API_URL=https://api-oficial.gov.br
 *    - OFFICIAL_PROVIDER_API_KEY=sua-chave-aqui
 * 
 * 2. Implemente a lógica de fetchResult() para consumir a API oficial
 * 
 * 3. Certifique-se de que a fonte é LEGAL e AUTORIZADA
 * 
 * ❌ NÃO IMPLEMENTE SCRAPING DE SITES NÃO AUTORIZADOS
 */

@Injectable()
export class OfficialProvider implements IResultProvider {
  private readonly logger = new Logger(OfficialProvider.name);

  constructor(private readonly configService: ConfigService) {}

  getName(): string {
    return 'OFFICIAL';
  }

  async isAvailable(): Promise<boolean> {
    const enabled = this.configService.get<boolean>('OFFICIAL_PROVIDER_ENABLED', false);
    const apiUrl = this.configService.get<string>('OFFICIAL_PROVIDER_API_URL');

    if (!enabled || !apiUrl) {
      this.logger.debug('Official provider não configurado ou desabilitado');
      return false;
    }

    return true;
  }

  async fetchResult(scheduledAt: Date): Promise<DrawResultData | null> {
    const available = await this.isAvailable();
    
    if (!available) {
      this.logger.warn('Official provider não está disponível');
      return null;
    }

    // ⚠️ STUB: Implementar lógica real aqui
    // Exemplo de implementação:
    /*
    try {
      const apiUrl = this.configService.get<string>('OFFICIAL_PROVIDER_API_URL');
      const apiKey = this.configService.get<string>('OFFICIAL_PROVIDER_API_KEY');

      const response = await fetch(`${apiUrl}/draws?scheduled=${scheduledAt.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(`Erro ao buscar resultado oficial: ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      return {
        milhares: data.numbers, // Adaptar conforme resposta da API
        source: ResultSource.OFFICIAL,
        externalRef: data.id,
        fetchedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao buscar resultado oficial:', error);
      return null;
    }
    */

    this.logger.warn('Official provider é um stub - implementar integração real');
    return null;
  }

  validateResult(milhares: number[]): boolean {
    // Mesma validação do AdminProvider
    if (!Array.isArray(milhares) || milhares.length !== 5) {
      return false;
    }

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
