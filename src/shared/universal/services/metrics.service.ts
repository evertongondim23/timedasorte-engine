import { Injectable, Logger } from '@nestjs/common';
import { register, Counter, Histogram } from 'prom-client';
import { User } from '@prisma/client';
import { EntityNameModel, EntityNameCasl } from '../types';

/**
 * 📊 Serviço Universal de Métricas Prometheus - VERSÃO ULTRA SIMPLES
 * 
 * Usa prom-client diretamente, sem dependências.
 * Cria métricas sob demanda quando necessário.
 * 
 * Características:
 * - ⚡ Ultra simples e direto
 * - 🔄 Totalmente opcional via ENV
 * - 📈 Métricas criadas dinamicamente
 * - 🎯 Zero dependências externas
 */
@Injectable()
export class UniversalMetricsService {
  private readonly logger = new Logger(UniversalMetricsService.name);
  private readonly metricsEnabled: boolean;
  
  // Métricas criadas dinamicamente
  private entityOperationsCounter?: Counter<string>;
  private operationDurationHistogram?: Histogram<string>;

  constructor() {
    this.metricsEnabled = process.env.ENABLE_PROMETHEUS_METRICS === 'true';
    
    if (this.metricsEnabled) {
      this.logger.log('📊 Métricas Prometheus ativadas - Versão Ultra Simples');
      this.initializeMetrics();
    } else {
      this.logger.log('📊 Métricas Prometheus desativadas via ENV');
    }
  }

  /**
   * Inicializa as métricas principais
   */
  private initializeMetrics(): void {
    try {
      // Counter para operações por entidade
      this.entityOperationsCounter = new Counter({
        name: 'jogo-da-sorte_entity_operations_total',
        help: 'Total de operações realizadas por entidade',
        labelNames: ['entity', 'action', 'status', 'user_role', 'company_id'],
        registers: [register],
      });

      // Histogram para duração das operações
      this.operationDurationHistogram = new Histogram({
        name: 'jogo-da-sorte_operation_duration_seconds',
        help: 'Duração das operações em segundos',
        labelNames: ['entity', 'action'],
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
        registers: [register],
      });

      this.logger.log('📈 Métricas principais inicializadas');
    } catch (error) {
      this.logger.error(`Erro ao inicializar métricas: ${error.message}`);
    }
  }

  // ============================================================================
  // 📈 MÉTODOS PRINCIPAIS - VERSÃO SIMPLES
  // ============================================================================

  /**
   * Registra operação em entidade - VERSÃO SIMPLES
   */
  recordEntityOperation(
    entity: EntityNameModel,
    action: 'create' | 'read' | 'update' | 'delete' | 'restore',
    status: 'success' | 'error',
    user?: User,
    duration?: number
  ): void {
    if (!this.metricsEnabled || !this.entityOperationsCounter) return;

    try {
      // Labels simples
      const labels = {
        entity,
        action,
        status,
        user_role: user?.role || 'unknown',
        company_id: user?.companyId || 'unknown',
      };

      // Incrementa contador
      this.entityOperationsCounter.inc(labels);

      // Registra duração se fornecida
      if (duration !== undefined && this.operationDurationHistogram) {
        this.operationDurationHistogram.observe(
          { entity, action },
          duration / 1000 // ms para segundos
        );
      }

      this.logger.debug(`📊 ${entity}.${action} = ${status}`);
    } catch (error) {
      this.logger.error(`Erro métrica: ${error.message}`);
    }
  }

  /**
   * Métodos vazios para manter compatibilidade - VERSÃO SIMPLES
   */
  recordPermissionCheck(...args: any[]): void {
    // Implementação futura se necessário
  }

  incrementConcurrentOperations(...args: any[]): void {
    // Implementação futura se necessário  
  }

  decrementConcurrentOperations(...args: any[]): void {
    // Implementação futura se necessário
  }

  /**
   * Status das métricas
   */
  isEnabled(): boolean {
    return this.metricsEnabled;
  }

  getStatus(): { enabled: boolean; provider: string } {
    return {
      enabled: this.metricsEnabled,
      provider: 'prometheus-simple',
    };
  }
}
