import { Injectable } from '@nestjs/common';
import { BetModality } from '@prisma/client';

/**
 * 🎲 GAME CONFIG SERVICE
 * 
 * Serviço responsável pelas configurações e regras do jogo "Times da Sorte"
 * Implementa a lógica do jogo clássico adaptada para times de futebol brasileiros.
 */

export interface GameRules {
  totalTeams: number;
  totalJerseys: number; // Total de dezenas (00-99 = 100)
  jerseysPerTeam: number;
  drawCount: number; // Quantos milhares são sorteados por rodada
  cutoffMinutes: number; // Minutos antes do sorteio para fechar apostas
}

export interface PayoutMultiplier {
  modality: BetModality;
  multiplier: number;
  name: string;
  description: string;
}

export interface TeamMapping {
  teamId: number;
  teamName: string;
  jerseys: number[]; // As 4 dezenas do time
  startJersey: number;
  endJersey: number;
}

@Injectable()
export class GameConfigService {
  private readonly rules: GameRules = {
    totalTeams: 25,
    totalJerseys: 100, // 00 a 99
    jerseysPerTeam: 4,
    drawCount: 5, // 5 milhares por sorteio
    cutoffMinutes: 30, // Fechar apostas 30 min antes
  };

  private readonly payoutMultipliers: PayoutMultiplier[] = [
    {
      modality: BetModality.TIME,
      multiplier: 18,
      name: 'Time da Sorte',
      description: 'Escolha um time e ganhe se ele for sorteado',
    },
    {
      modality: BetModality.CAMISA,
      multiplier: 60,
      name: 'Camisa (Dezena)',
      description: 'Acerte o número da camisa sorteada',
    },
    {
      modality: BetModality.CENTENA,
      multiplier: 600,
      name: 'Centena',
      description: 'Acerte os 3 últimos dígitos',
    },
    {
      modality: BetModality.MILHAR,
      multiplier: 4000,
      name: 'Milhar',
      description: 'Acerte os 4 dígitos exatos',
    },
    {
      modality: BetModality.DUPLA,
      multiplier: 300,
      name: 'Dupla de Times (Duque)',
      description: 'Escolha 2 times distintos',
    },
    {
      modality: BetModality.TERNO,
      multiplier: 3000,
      name: 'Terno de Times',
      description: 'Escolha 3 times distintos',
    },
    {
      modality: BetModality.PASSE,
      multiplier: 120,
      name: 'Passe (Time + Camisa)',
      description: 'Escolha time e uma dezena pertencente àquele time',
    },
  ];

  /**
   * Retorna as regras gerais do jogo
   */
  getRules(): GameRules {
    return { ...this.rules };
  }

  /**
   * Retorna os multiplicadores de pagamento por modalidade
   */
  getPayoutMultipliers(): PayoutMultiplier[] {
    return [...this.payoutMultipliers];
  }

  /**
   * Retorna o multiplicador para uma modalidade específica
   */
  getMultiplierForModality(modality: BetModality): number {
    const config = this.payoutMultipliers.find((p) => p.modality === modality);
    return config?.multiplier || 0;
  }

  /**
   * Converte uma dezena (00-99) para o ID do time (1-25)
   * 
   * REGRAS:
   * - Dezena 00 pertence ao time 25 (tratada como 100 para cálculo)
   * - Dezenas 01-04 = Time 1
   * - Dezenas 05-08 = Time 2
   * - ...
   * - Dezenas 97-99,00 = Time 25
   * 
   * FÓRMULA: teamId = Math.ceil(dezena_adjusted / 4)
   */
  jerseyToTeamId(jersey: number): number {
    if (jersey < 0 || jersey > 99) {
      throw new Error(`Dezena inválida: ${jersey}. Deve estar entre 0 e 99.`);
    }

    // Dezena 00 é tratada como 100 para cálculo
    const adjustedJersey = jersey === 0 ? 100 : jersey;
    
    // Calcular o time: ceil(dezena/4)
    const teamId = Math.ceil(adjustedJersey / this.rules.jerseysPerTeam);
    
    return teamId;
  }

  /**
   * Retorna as 4 dezenas que pertencem a um time
   * 
   * REGRAS:
   * - Time 1: [01, 02, 03, 04]
   * - Time 2: [05, 06, 07, 08]
   * - ...
   * - Time 24: [93, 94, 95, 96]
   * - Time 25: [97, 98, 99, 00]
   */
  getTeamJerseys(teamId: number): number[] {
    if (teamId < 1 || teamId > this.rules.totalTeams) {
      throw new Error(`Time inválido: ${teamId}. Deve estar entre 1 e 25.`);
    }

    const jerseys: number[] = [];
    const startJersey = (teamId - 1) * this.rules.jerseysPerTeam + 1;

    for (let i = 0; i < this.rules.jerseysPerTeam; i++) {
      let jersey = startJersey + i;
      
      // Time 25 tem as dezenas 97, 98, 99, 00
      if (jersey > 99) {
        jersey = 0;
      }
      
      jerseys.push(jersey);
    }

    return jerseys;
  }

  /**
   * Extrai a dezena (últimos 2 dígitos) de um milhar (0000-9999)
   */
  milharToJersey(milhar: number): number {
    if (milhar < 0 || milhar > 9999) {
      throw new Error(`Milhar inválido: ${milhar}. Deve estar entre 0 e 9999.`);
    }
    
    return milhar % 100;
  }

  /**
   * Extrai a centena (últimos 3 dígitos) de um milhar (0000-9999)
   */
  milharToCentena(milhar: number): number {
    if (milhar < 0 || milhar > 9999) {
      throw new Error(`Milhar inválido: ${milhar}. Deve estar entre 0 e 9999.`);
    }
    
    return milhar % 1000;
  }

  /**
   * Converte um milhar em resultado completo: { milhar, centena, jersey, teamId }
   */
  milharToResult(milhar: number) {
    const jersey = this.milharToJersey(milhar);
    const centena = this.milharToCentena(milhar);
    const teamId = this.jerseyToTeamId(jersey);

    return {
      milhar,
      centena,
      jersey,
      teamId,
    };
  }

  /**
   * Processa um array de 5 milhares e retorna o resultado completo da rodada
   */
  processDrawResult(milhares: number[]) {
    if (milhares.length !== this.rules.drawCount) {
      throw new Error(
        `Quantidade inválida de milhares: ${milhares.length}. Esperado: ${this.rules.drawCount}`,
      );
    }

    const results = milhares.map((milhar) => this.milharToResult(milhar));
    
    // Extrair arrays únicos
    const jerseys = [...new Set(results.map((r) => r.jersey))];
    const centenas = [...new Set(results.map((r) => r.centena))];
    const teams = [...new Set(results.map((r) => r.teamId))];

    return {
      milhares,
      jerseys,
      centenas,
      teams,
      details: results,
    };
  }

  /**
   * Calcula o cutoffAt baseado no scheduledAt
   */
  calculateCutoffTime(scheduledAt: Date): Date {
    const cutoff = new Date(scheduledAt);
    cutoff.setMinutes(cutoff.getMinutes() - this.rules.cutoffMinutes);
    return cutoff;
  }

  /**
   * Verifica se ainda é possível apostar (antes do cutoff)
   */
  canPlaceBet(cutoffAt: Date): boolean {
    return new Date() < cutoffAt;
  }

  /**
   * Retorna a configuração completa do jogo para o frontend
   */
  getGameConfig() {
    return {
      rules: this.getRules(),
      payoutMultipliers: this.getPayoutMultipliers(),
      teams: Array.from({ length: this.rules.totalTeams }, (_, i) => {
        const teamId = i + 1;
        return {
          id: teamId,
          jerseys: this.getTeamJerseys(teamId),
        };
      }),
    };
  }
}
