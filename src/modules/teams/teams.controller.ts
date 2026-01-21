import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AuthGuard } from '../../shared/auth/guards/auth.guard';
import { RequiredRoles } from '../../shared/auth/required-roles.decorator';
import { Roles } from '@prisma/client';
import { Public } from '../../shared/auth/decorators/public.decorator';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Criar time (admin)
   */
  @Post()
  @UseGuards(AuthGuard)
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  /**
   * Listar todos os times
   * Query: ?includeInactive=true para incluir inativos
   */
  @Get()
  @Public() // Endpoint público
  findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    return this.teamsService.findAll(includeInactive);
  }

  /**
   * Listar apenas times ativos
   */
  @Get('active')
  @Public() // Endpoint público
  findAllActive() {
    return this.teamsService.findAllActive();
  }

  /**
   * Buscar time por nome
   */
  @Get('name/:name')
  @Public() // Endpoint público
  findByName(@Param('name') name: string) {
    return this.teamsService.findByName(name);
  }

  /**
   * Buscar time por camisa
   */
  @Get('jersey/:number')
  @Public() // Endpoint público
  findByJersey(@Param('number', ParseIntPipe) jerseyNumber: number) {
    return this.teamsService.findByJersey(jerseyNumber);
  }

  /**
   * Buscar times por cor
   */
  @Get('color/:color')
  @Public() // Endpoint público
  findByColor(@Param('color') color: string) {
    return this.teamsService.findByColor(color);
  }

  /**
   * Buscar time por ID
   */
  @Get(':id')
  @Public() // Endpoint público
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  /**
   * Estatísticas do time
   */
  @Get(':id/stats')
  @Public() // Endpoint público
  getStats(@Param('id') id: string) {
    return this.teamsService.getStats(id);
  }

  /**
   * Atualizar time (admin)
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  /**
   * Ativar/desativar time (admin)
   */
  @Patch(':id/toggle-active')
  @UseGuards(AuthGuard)
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.teamsService.toggleActive(id);
  }

  /**
   * Remover time (admin)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
