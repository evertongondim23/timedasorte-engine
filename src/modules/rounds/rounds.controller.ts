import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { PublishResultDto } from './dto/publish-result.dto';
import { SuccessResponseDto } from '@/shared/dto/success-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/shared/auth/guards/auth.guard';
import { RoleGuard } from '@/shared/auth/guards/role.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { DrawStatus } from '@prisma/client';

/**
 * 🎰 ROUNDS CONTROLLER
 * 
 * Endpoints para gerenciamento de rodadas públicas e administrativas
 */

@ApiTags('Rounds')
@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  /**
   * GET /api/rounds/next
   * 
   * Retorna a próxima rodada disponível para apostas
   * Inclui: scheduledAt, cutoffAt, status, canPlaceBet, minutesToCutoff
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
  async getNext(): Promise<SuccessResponseDto<any>> {
    const draw = await this.roundsService.getNext();
    
    if (!draw) {
      return SuccessResponseDto.create({
        data: null,
        message: 'Nenhuma rodada disponível no momento',
      });
    }

    return SuccessResponseDto.create({
      data: draw,
      message: 'Próxima rodada recuperada com sucesso',
    });
  }

  /**
   * GET /api/rounds/:id
   * 
   * Retorna detalhes de uma rodada específica
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
  async findOne(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const draw = await this.roundsService.findOne(id);
    
    return SuccessResponseDto.create({
      data: draw,
      message: 'Rodada recuperada com sucesso',
    });
  }

  /**
   * GET /api/rounds/:id/result
   * 
   * Retorna o resultado publicado de uma rodada
   */
  @Get(':id/result')
  @ApiOperation({ 
    summary: 'Obter resultado da rodada',
    description: 'Retorna milhares, dezenas, times e estatísticas do sorteio' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado retornado com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Resultado ainda não publicado' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  async getResult(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const result = await this.roundsService.getResult(id);
    
    return SuccessResponseDto.create({
      data: result,
      message: 'Resultado recuperado com sucesso',
    });
  }

  /**
   * GET /api/rounds
   * 
   * Lista rodadas com paginação e filtros
   */
  @Get()
  @ApiOperation({ 
    summary: 'Listar rodadas',
    description: 'Lista rodadas com paginação e filtros opcionais' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodadas listadas com sucesso' 
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: DrawStatus,
  ): Promise<SuccessResponseDto<any>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.roundsService.findAll(pageNum, limitNum, status);
    
    return SuccessResponseDto.create({
      data: result.data,
      message: 'Rodadas recuperadas com sucesso',
      meta: result.meta,
    });
  }

  /**
   * POST /api/rounds
   * 
   * Cria uma nova rodada (ADMIN only)
   */
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN', 'OPERATOR')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar nova rodada (Admin)',
    description: 'Cria uma nova rodada com data/hora agendada. Requer autenticação e role ADMIN.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Rodada criada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Não autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Sem permissão (não é ADMIN)' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Já existe rodada para esse horário' 
  })
  async create(@Body() createRoundDto: CreateRoundDto): Promise<SuccessResponseDto<any>> {
    const draw = await this.roundsService.create(createRoundDto);
    
    return SuccessResponseDto.create({
      data: draw,
      message: 'Rodada criada com sucesso',
    });
  }

  /**
   * POST /api/rounds/:id/publish
   * 
   * Publica o resultado de uma rodada (ADMIN only)
   */
  @Post(':id/publish')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN', 'OPERATOR')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Publicar resultado da rodada (Admin)',
    description: 'Publica os milhares sorteados e inicia o processamento de apostas. Requer autenticação e role ADMIN.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado publicado e processamento iniciado' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Não autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Sem permissão' 
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
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.roundsService.publishResult(id, publishResultDto);
    
    return SuccessResponseDto.create({
      data: result,
      message: result.message,
    });
  }

  /**
   * POST /api/rounds/:id/cancel
   * 
   * Cancela uma rodada (ADMIN only)
   */
  @Post(':id/cancel')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancelar rodada (Admin)',
    description: 'Cancela uma rodada e reembolsa apostas. Requer autenticação e role ADMIN.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rodada cancelada com sucesso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Não autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Sem permissão' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Não é possível cancelar rodada finalizada' 
  })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.roundsService.cancel(id, reason);
    
    return SuccessResponseDto.create({
      data: result,
      message: result.message,
    });
  }
}
