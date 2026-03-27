import { Controller, Get, Param, Query } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundScheduleService } from './round-schedule.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * 🎰 ROUNDS CONTROLLER
 * 
 * Endpoints públicos para consulta de rodadas
 */

@ApiTags('Rounds')
@Controller('rounds')
export class RoundsController {
  constructor(
    private readonly roundsService: RoundsService,
    private readonly scheduleService: RoundScheduleService,
  ) {}

  /**
   * GET /api/rounds/available
   * 
   * Retorna informações sobre rodadas disponíveis:
   * - available: próxima rodada OPEN (pode apostar)
   * - nextClosed: próxima rodada CLOSED/PENDING_RESULT (aguardando resultado)
   * - nextScheduled: próxima rodada agendada (ainda não abriu)
   */
  @Get('available')
  @ApiOperation({ 
    summary: 'Obter rodadas disponíveis',
    description: 'Retorna próxima rodada disponível, próxima fechada e próxima agendada' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informações de rodadas retornadas com sucesso' 
  })
  async getAvailable() {
    return await this.scheduleService.getAvailableRoundsInfo();
  }

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
    return await this.scheduleService.getNextAvailableRound();
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
   * Última rodada com resultado (não depende da paginação de GET /rounds).
   */
  @Get('latest-published')
  @ApiOperation({
    summary: 'Última rodada com resultado publicado',
    description:
      'Retorna a rodada cujo resultado saiu mais recentemente (ordenado por publishedAt desc, depois updatedAt/scheduledAt). Resposta null se não houver.',
  })
  async getLatestPublished() {
    return await this.roundsService.findLatestWithPublishedResult();
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
