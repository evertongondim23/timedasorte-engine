import { Test, TestingModule } from '@nestjs/testing';
import { GameConfigService } from './game-config.service';
import { BetModality } from '@prisma/client';

describe('GameConfigService', () => {
  let service: GameConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameConfigService],
    }).compile();

    service = module.get<GameConfigService>(GameConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('jerseyToTeamId', () => {
    it('should map jersey 01-04 to team 1', () => {
      expect(service.jerseyToTeamId(1)).toBe(1);
      expect(service.jerseyToTeamId(2)).toBe(1);
      expect(service.jerseyToTeamId(3)).toBe(1);
      expect(service.jerseyToTeamId(4)).toBe(1);
    });

    it('should map jersey 05-08 to team 2', () => {
      expect(service.jerseyToTeamId(5)).toBe(2);
      expect(service.jerseyToTeamId(6)).toBe(2);
      expect(service.jerseyToTeamId(7)).toBe(2);
      expect(service.jerseyToTeamId(8)).toBe(2);
    });

    it('should map jersey 93-96 to team 24', () => {
      expect(service.jerseyToTeamId(93)).toBe(24);
      expect(service.jerseyToTeamId(94)).toBe(24);
      expect(service.jerseyToTeamId(95)).toBe(24);
      expect(service.jerseyToTeamId(96)).toBe(24);
    });

    it('should map jersey 97-99 to team 25', () => {
      expect(service.jerseyToTeamId(97)).toBe(25);
      expect(service.jerseyToTeamId(98)).toBe(25);
      expect(service.jerseyToTeamId(99)).toBe(25);
    });

    it('should map jersey 00 to team 25 (special case)', () => {
      expect(service.jerseyToTeamId(0)).toBe(25);
    });

    it('should throw error for invalid jersey', () => {
      expect(() => service.jerseyToTeamId(-1)).toThrow('Dezena inválida');
      expect(() => service.jerseyToTeamId(100)).toThrow('Dezena inválida');
    });
  });

  describe('getTeamJerseys', () => {
    it('should return [01,02,03,04] for team 1', () => {
      expect(service.getTeamJerseys(1)).toEqual([1, 2, 3, 4]);
    });

    it('should return [05,06,07,08] for team 2', () => {
      expect(service.getTeamJerseys(2)).toEqual([5, 6, 7, 8]);
    });

    it('should return [93,94,95,96] for team 24', () => {
      expect(service.getTeamJerseys(24)).toEqual([93, 94, 95, 96]);
    });

    it('should return [97,98,99,00] for team 25', () => {
      expect(service.getTeamJerseys(25)).toEqual([97, 98, 99, 0]);
    });

    it('should throw error for invalid team', () => {
      expect(() => service.getTeamJerseys(0)).toThrow('Time inválido');
      expect(() => service.getTeamJerseys(26)).toThrow('Time inválido');
    });

    it('should have 4 jerseys per team', () => {
      for (let teamId = 1; teamId <= 25; teamId++) {
        const jerseys = service.getTeamJerseys(teamId);
        expect(jerseys).toHaveLength(4);
      }
    });

    it('all teams should cover all 100 jerseys (0-99)', () => {
      const allJerseys = new Set<number>();
      for (let teamId = 1; teamId <= 25; teamId++) {
        const jerseys = service.getTeamJerseys(teamId);
        jerseys.forEach((j) => allJerseys.add(j));
      }
      expect(allJerseys.size).toBe(100);
      expect(Array.from(allJerseys).sort((a, b) => a - b)).toEqual(
        Array.from({ length: 100 }, (_, i) => i),
      );
    });
  });

  describe('milharToJersey', () => {
    it('should extract last 2 digits', () => {
      expect(service.milharToJersey(1234)).toBe(34);
      expect(service.milharToJersey(5678)).toBe(78);
      expect(service.milharToJersey(9012)).toBe(12);
    });

    it('should handle edge cases', () => {
      expect(service.milharToJersey(0)).toBe(0);
      expect(service.milharToJersey(7)).toBe(7);
      expect(service.milharToJersey(100)).toBe(0);
      expect(service.milharToJersey(9999)).toBe(99);
    });

    it('should throw error for invalid milhar', () => {
      expect(() => service.milharToJersey(-1)).toThrow('Milhar inválido');
      expect(() => service.milharToJersey(10000)).toThrow('Milhar inválido');
    });
  });

  describe('milharToCentena', () => {
    it('should extract last 3 digits', () => {
      expect(service.milharToCentena(1234)).toBe(234);
      expect(service.milharToCentena(5678)).toBe(678);
      expect(service.milharToCentena(9012)).toBe(12);
    });

    it('should handle edge cases', () => {
      expect(service.milharToCentena(0)).toBe(0);
      expect(service.milharToCentena(7)).toBe(7);
      expect(service.milharToCentena(100)).toBe(100);
      expect(service.milharToCentena(9999)).toBe(999);
    });
  });

  describe('milharToResult', () => {
    it('should return complete result for a milhar', () => {
      const result = service.milharToResult(1234);
      expect(result).toEqual({
        milhar: 1234,
        centena: 234,
        jersey: 34,
        teamId: 9, // jersey 34 -> ceil(34/4) = 9
      });
    });

    it('should handle milhar with jersey 00', () => {
      const result = service.milharToResult(1200);
      expect(result).toEqual({
        milhar: 1200,
        centena: 200,
        jersey: 0,
        teamId: 25, // jersey 00 -> team 25
      });
    });
  });

  describe('processDrawResult', () => {
    it('should process 5 milhares and return draw result', () => {
      const milhares = [1234, 5678, 9012, 3456, 7890];
      const result = service.processDrawResult(milhares);

      expect(result.milhares).toEqual(milhares);
      expect(result.jerseys).toContain(34); // from 1234
      expect(result.jerseys).toContain(78); // from 5678
      expect(result.jerseys).toContain(12); // from 9012
      expect(result.teams.length).toBeGreaterThan(0);
      expect(result.details).toHaveLength(5);
    });

    it('should remove duplicate jerseys and teams', () => {
      // Mesma dezena e time em vários milhares
      const milhares = [1234, 2234, 3234, 4234, 5234];
      const result = service.processDrawResult(milhares);

      expect(result.jerseys).toEqual([34]); // Todos têm dezena 34
      expect(result.teams).toEqual([9]); // Todos são team 9
    });

    it('should throw error if not exactly 5 milhares', () => {
      expect(() => service.processDrawResult([1234])).toThrow(
        'Quantidade inválida de milhares',
      );
      expect(() =>
        service.processDrawResult([1234, 5678, 9012, 3456, 7890, 1111]),
      ).toThrow('Quantidade inválida de milhares');
    });
  });

  describe('getMultiplierForModality', () => {
    it('should return correct multiplier for each modality', () => {
      expect(service.getMultiplierForModality(BetModality.TIME)).toBe(18);
      expect(service.getMultiplierForModality(BetModality.CAMISA)).toBe(60);
      expect(service.getMultiplierForModality(BetModality.CENTENA)).toBe(600);
      expect(service.getMultiplierForModality(BetModality.MILHAR)).toBe(4000);
      expect(service.getMultiplierForModality(BetModality.DUPLA)).toBe(300);
      expect(service.getMultiplierForModality(BetModality.TERNO)).toBe(3000);
      expect(service.getMultiplierForModality(BetModality.PASSE)).toBe(120);
    });
  });

  describe('calculateCutoffTime', () => {
    it('should calculate cutoff 30 minutes before scheduled time', () => {
      const scheduledAt = new Date('2026-01-22T14:00:00Z');
      const cutoffAt = service.calculateCutoffTime(scheduledAt);

      expect(cutoffAt).toEqual(new Date('2026-01-22T13:30:00Z'));
    });
  });

  describe('canPlaceBet', () => {
    it('should return true if current time is before cutoff', () => {
      const futureDate = new Date(Date.now() + 3600000); // +1 hora
      expect(service.canPlaceBet(futureDate)).toBe(true);
    });

    it('should return false if current time is after cutoff', () => {
      const pastDate = new Date(Date.now() - 3600000); // -1 hora
      expect(service.canPlaceBet(pastDate)).toBe(false);
    });
  });

  describe('getGameConfig', () => {
    it('should return complete game configuration', () => {
      const config = service.getGameConfig();

      expect(config.rules).toBeDefined();
      expect(config.rules.totalTeams).toBe(25);
      expect(config.rules.totalJerseys).toBe(100);
      
      expect(config.payoutMultipliers).toHaveLength(7);
      
      expect(config.teams).toHaveLength(25);
      expect(config.teams[0].id).toBe(1);
      expect(config.teams[0].jerseys).toEqual([1, 2, 3, 4]);
      expect(config.teams[24].id).toBe(25);
      expect(config.teams[24].jerseys).toEqual([97, 98, 99, 0]);
    });
  });

  describe('Integration: Full game flow', () => {
    it('should correctly map a complete draw scenario', () => {
      // Cenário: Sorteio com 5 milhares
      const milhares = [1234, 5697, 9100, 3450, 7808];
      
      // Processar resultado
      const drawResult = service.processDrawResult(milhares);

      // Verificar milhares
      expect(drawResult.milhares).toEqual(milhares);

      // Verificar dezenas extraídas
      expect(drawResult.jerseys).toContain(34); // de 1234
      expect(drawResult.jerseys).toContain(97); // de 5697
      expect(drawResult.jerseys).toContain(0);  // de 9100
      expect(drawResult.jerseys).toContain(50); // de 3450
      expect(drawResult.jerseys).toContain(8);  // de 7808

      // Verificar times
      expect(drawResult.teams).toContain(9);  // jersey 34 -> team 9
      expect(drawResult.teams).toContain(25); // jersey 97 -> team 25
      expect(drawResult.teams).toContain(25); // jersey 0 -> team 25
      expect(drawResult.teams).toContain(13); // jersey 50 -> team 13
      expect(drawResult.teams).toContain(2);  // jersey 8 -> team 2

      // Times únicos (remove duplicatas)
      const uniqueTeams = [...new Set(drawResult.teams)];
      expect(uniqueTeams).toContain(2);
      expect(uniqueTeams).toContain(9);
      expect(uniqueTeams).toContain(13);
      expect(uniqueTeams).toContain(25);
    });
  });
});
