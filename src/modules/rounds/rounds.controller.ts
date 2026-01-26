import { Controller, Get, Param, Query } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * 🎰 ROUNDS CONTROLLER
 * 
 * Endpoints públicos para consulta de rodadas
 */

@ApiTags('Rounds')
@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  /**
   * GET /api/rounds/next
   * 
   * Retorna a próxima rodada disponível para apostas
   */
  @Get('next')
  @ApiOperation({ 
    summary: 'Obter próxima rodada',
    description: 'Retorna a próxima rodada aberta para apostas com informações de cutoff' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Próxima rodada retornada com sucesso' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Nenhuma rodada disponível' 
  })
  async getNext() {
    return await this.roundsService.getNext();
  }

  /**
   * GET /api/rounds
   * 
   * Lista todas as rodadas abertas
   */
  @Get()
  @ApiOperation({ 
    summary: 'Listar rodadas abertas',
    description: 'Retorna todas as rodadas disponíveis para apostas' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodadas listadas com sucesso' 
  })
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return await this.roundsService.findAll(pageNum, limitNum);
  }

  /**
   * GET /api/rounds/:id
   * 
   * Detalhes de uma rodada específica
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Obter detalhes da rodada',
    description: 'Retorna informações completas de uma rodada por ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodada encontrada' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  async getOne(@Param('id') id: string) {
    return await this.roundsService.findOne(id);
  }

  /**
   * GET /api/rounds/:id/result
   * 
   * Resultado publicado de uma rodada
   */
  @Get(':id/result')
  @ApiOperation({ 
    summary: 'Obter resultado da rodada',
    description: 'Retorna o resultado publicado de uma rodada finalizada' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado encontrado' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada ou resultado ainda não publicado' 
  })
  async getResult(@Param('id') id: string) {
    return await this.roundsService.getResult(id);
  }
}
