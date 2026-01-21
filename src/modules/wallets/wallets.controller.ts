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
   */
  @Get('me')
  findMine(@CurrentUser() user: any) {
    return this.walletsService.findByUserId(user.sub);
  }

  /**
   * Consultar meu saldo
   */
  @Get('me/balance')
  getMyBalance(@CurrentUser() user: any) {
    return this.walletsService.getBalance(user.sub);
  }

  /**
   * Buscar carteira por ID (admin)
   */
  @Get(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  /**
   * Atualizar carteira (admin)
   */
  @Patch(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletsService.update(id, updateWalletDto);
  }

  /**
   * Deletar carteira (admin)
   */
  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.walletsService.remove(id);
  }

  /**
   * Depositar na minha carteira
   */
  @Post('me/deposit')
  deposit(@CurrentUser() user: any, @Body() depositDto: DepositDto) {
    return this.walletsService.deposit(user.sub, depositDto);
  }

  /**
   * Sacar da minha carteira
   */
  @Post('me/withdraw')
  withdraw(@CurrentUser() user: any, @Body() withdrawDto: WithdrawDto) {
    return this.walletsService.withdraw(user.sub, withdrawDto);
  }
}
