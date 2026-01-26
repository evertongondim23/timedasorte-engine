import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RoundsService } from '../rounds/rounds.service';
import { CreateRoundDto } from '../rounds/dto/create-round.dto';
import { PublishResultDto } from '../rounds/dto/publish-result.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { Roles } from '@prisma/client';

/**
 * 🛡️ ADMIN CONTROLLER
 * 
 * Endpoints administrativos para gestão do jogo
 * Requer autenticação e role=admin
 */

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
@RequiredRoles(Roles.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly roundsService: RoundsService) {}

  /**
   * POST /api/admin/rounds
   * 
   * Cria uma nova rodada (apenas admin)
   */
  @Post('rounds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar nova rodada',
    description: 'Cria uma nova rodada com horário agendado. Calcula automaticamente o cutoff (30min antes).' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Rodada criada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou data no passado' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Não autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Sem permissão de admin' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Já existe rodada para esse horário' 
  })
  async createRound(
    @Body() createRoundDto: CreateRoundDto,
  ) {
    return await this.roundsService.create(createRoundDto);
  }

  /**
   * POST /api/admin/rounds/:id/publish
   * 
   * Publica o resultado de uma rodada
   */
  @Post('rounds/:id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Publicar resultado',
    description: 'Publica os 5 milhares sorteados. Sistema calcula automaticamente dezenas/times e processa vencedores.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado publicado e apostas processadas' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Rodada já finalizada' 
  })
  async publishResult(
    @Param('id') id: string,
    @Body() publishResultDto: PublishResultDto,
  ) {
    return await this.roundsService.publishResult(id, publishResultDto);
  }

  /**
   * POST /api/admin/rounds/:id/cancel
   * 
   * Cancela uma rodada
   */
  @Post('rounds/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancelar rodada',
    description: 'Cancela uma rodada e reembolsa todas as apostas realizadas.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodada cancelada com sucesso' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Rodada já finalizada - não pode cancelar' 
  })
  async cancelRound(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ) {
    return await this.roundsService.cancel(id, body?.reason);
  }

  /**
   * POST /api/admin/rounds/close-expired
   * 
   * Fecha automaticamente rodadas cujo cutoff passou
   */
  @Post('rounds/close-expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Fechar rodadas expiradas',
    description: 'Fecha automaticamente rodadas cujo cutoff já passou (normalmente executado por cron).' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodadas fechadas automaticamente' 
  })
  async closeExpiredRounds() {
    return await this.roundsService.closeExpiredRounds();
  }

  /**
   * GET /api/admin/rounds
   * 
   * Lista todas as rodadas (incluindo fechadas e canceladas)
   */
  @Get('rounds')
  @ApiOperation({ 
    summary: 'Listar todas as rodadas',
    description: 'Lista todas as rodadas com paginação (visão administrativa).' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodadas listadas com sucesso' 
  })
  async listAllRounds(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    return await this.roundsService.findAll(pageNum, limitNum);
  }

  /**
   * GET /api/admin/rounds/:id
   * 
   * Detalhes de uma rodada (incluindo estatísticas e apostas)
   */
  @Get('rounds/:id')
  @ApiOperation({ 
    summary: 'Detalhes da rodada',
    description: 'Retorna informações completas de uma rodada incluindo estatísticas.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodada encontrada' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  async getRoundDetails(
    @Param('id') id: string,
  ) {
    return await this.roundsService.findOne(id);
  }
}
