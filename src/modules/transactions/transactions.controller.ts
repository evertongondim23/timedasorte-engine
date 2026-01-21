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
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { AuthGuard } from '../../shared/auth/guards/auth.guard';
import { RequiredRoles } from '../../shared/auth/required-roles.decorator';
import { Roles } from '@prisma/client';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { UserPayload } from '../../shared/auth/interfaces/user-payload.interface';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Criar transação (admin)
   */
  @Post()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  /**
   * Listar todas as transações (admin)
   */
  @Get()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  findAll(@Query() filterDto?: FilterTransactionsDto) {
    return this.transactionsService.findAll(filterDto);
  }

  /**
   * Listar minhas transações
   */
  @Get('me')
  findMyTransactions(
    @CurrentUser() user: UserPayload,
    @Query() filterDto?: FilterTransactionsDto,
  ) {
    return this.transactionsService.findMyTransactions(user.id, filterDto);
  }

  /**
   * Resumo das minhas transações
   */
  @Get('me/summary')
  getMySummary(@CurrentUser() user: UserPayload) {
    return this.transactionsService.getMySummary(user.id);
  }

  /**
   * Buscar minha transação por ID
   */
  @Get('me/:id')
  findMyTransaction(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.transactionsService.findMyTransaction(id, user.id);
  }

  /**
   * Buscar transação por ID (admin)
   */
  @Get(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  /**
   * Atualizar transação (admin)
   */
  @Patch(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  /**
   * Remover transação (admin)
   */
  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}

