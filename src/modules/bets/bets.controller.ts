import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { CurrentUser } from 'src/shared/auth/decorators/current-user.decorator';
import { UserPayload } from 'src/shared/auth/interfaces/user-payload.interface';
import { BetStatus } from '@prisma/client';

/**
 * 🎲 BETS CONTROLLER
 * 
 * Endpoints para criação e consulta de apostas
 */

@ApiTags('Bets')
@Controller('bets')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  /**
   * POST /api/bets
   * 
   * Cria uma nova aposta
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar aposta',
    description: 'Cria uma nova aposta para o usuário autenticado. Valida modalidade, saldo e cutoff.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Aposta criada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou saldo insuficiente' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Não autenticado' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Rodada não encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Cutoff já passou - apostas fechadas' 
  })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() createBetDto: CreateBetDto,
  ) {
    return await this.betsService.create(user.id, createBetDto);
  }

  /**
   * GET /api/bets/me
   * 
   * Lista apostas do usuário autenticado
   */
  @Get('me')
  @ApiOperation({ 
    summary: 'Listar minhas apostas',
    description: 'Retorna todas as apostas do usuário autenticado com paginação' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Apostas listadas com sucesso' 
  })
  async findMine(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: BetStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return await this.betsService.findByUser(user.id, pageNum, limitNum, status);
  }

  /**
   * GET /api/bets/:id
   * 
   * Detalhes de uma aposta específica
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Obter detalhes da aposta',
    description: 'Retorna informações completas de uma aposta por ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Aposta encontrada' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Aposta não encontrada' 
  })
  async findOne(
    @Param('id') id: string,
  ) {
    return await this.betsService.findOne(id);
  }

  /**
   * DELETE /api/bets/:id
   * 
   * Cancela uma aposta (antes do cutoff)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancelar aposta',
    description: 'Cancela uma aposta pendente e reembolsa o valor. Apenas antes do cutoff.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Aposta cancelada e valor reembolsado' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Aposta não pode ser cancelada' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Aposta não encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Cutoff já passou - não pode cancelar' 
  })
  async cancel(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return await this.betsService.cancel(id, user.id);
  }
}
