import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { AuthGuard } from '../../shared/auth/guards/auth.guard';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { UserPayload } from '../../shared/auth/interfaces/user-payload.interface';
import { Roles } from '@prisma/client';
import { RequiredRoles } from '../../shared/auth/required-roles.decorator';

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  /**
   * Criar carteira (admin)
   */
  @Post()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  /**
   * Listar todas as carteiras (admin)
   */
  @Get()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  findAll() {
    return this.walletsService.findAll();
  }

  /**
   * Consultar minha carteira
   * Cria automaticamente se não existir
   */
  @Get('me')
  async findMine(@CurrentUser() user: UserPayload) {
    return this.walletsService.findOrCreateByUserId(user.id);
  }

  /**
   * Consultar meu saldo
   */
  @Get('me/balance')
  async getMyBalance(@CurrentUser() user: UserPayload) {
    return this.walletsService.getBalance(user.id);
  }

  /**
   * Buscar carteira por ID (admin)
   */
  @Get(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }
 //  [TODO] - Remover apos teste em desenvolvimento
  /**
   * Atualizar carteira (admin)
   */
  @Patch(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletsService.update(id, updateWalletDto);
  }

  /**
   * Depositar na minha carteira
   */
  @Post('me/deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(@CurrentUser() user: UserPayload, @Body() depositDto: DepositDto) {
    return this.walletsService.deposit(user.id, depositDto);
  }

  /**
   * Sacar da minha carteira
   */
  @Post('me/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(@CurrentUser() user: UserPayload, @Body() withdrawDto: WithdrawDto) {
    return this.walletsService.withdraw(user.id, withdrawDto);
  }

  /**
   * Deletar carteira (admin) - soft delete
   */
  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.walletsService.remove(id);
  }
}
