import { Controller, Get } from '@nestjs/common';
import { GameConfigService } from './game-config.service';
import { SuccessResponseDto } from '@/shared/dto/success-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * 🎲 GAME CONTROLLER
 * 
 * Endpoints para configuração e regras do jogo
 */

@ApiTags('Game')
@Controller('game')
export class GameController {
  constructor(private readonly gameConfigService: GameConfigService) {}

  /**
   * GET /api/game/config
   * 
   * Retorna a configuração completa do jogo:
   * - Regras gerais (quantidade de times, dezenas, etc)
   * - Multiplicadores de pagamento por modalidade
   * - Mapeamento de times e suas dezenas
   */
  @Get('config')
  @ApiOperation({ 
    summary: 'Obter configuração do jogo',
    description: 'Retorna todas as regras, multiplicadores e mapeamento de times/dezenas' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuração do jogo retornada com sucesso' 
  })
  getConfig(): SuccessResponseDto<any> {
    const config = this.gameConfigService.getGameConfig();
    
    return SuccessResponseDto.create({
      data: config,
      message: 'Configuração do jogo recuperada com sucesso',
    });
  }

  /**
   * GET /api/game/rules
   * 
   * Retorna apenas as regras gerais do jogo
   */
  @Get('rules')
  @ApiOperation({ 
    summary: 'Obter regras do jogo',
    description: 'Retorna as regras gerais (quantidade de times, dezenas por time, etc)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Regras do jogo retornadas com sucesso' 
  })
  getRules(): SuccessResponseDto<any> {
    const rules = this.gameConfigService.getRules();
    
    return SuccessResponseDto.create({
      data: rules,
      message: 'Regras do jogo recuperadas com sucesso',
    });
  }

  /**
   * GET /api/game/multipliers
   * 
   * Retorna os multiplicadores de pagamento para cada modalidade
   */
  @Get('multipliers')
  @ApiOperation({ 
    summary: 'Obter multiplicadores de pagamento',
    description: 'Retorna os multiplicadores para cada tipo de aposta' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Multiplicadores retornados com sucesso' 
  })
  getMultipliers(): SuccessResponseDto<any> {
    const multipliers = this.gameConfigService.getPayoutMultipliers();
    
    return SuccessResponseDto.create({
      data: multipliers,
      message: 'Multiplicadores recuperados com sucesso',
    });
  }
}
