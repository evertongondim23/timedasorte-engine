import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { GameModule } from '../game/game.module';
import { RoundsModule } from '../rounds/rounds.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [PrismaModule, GameModule, RoundsModule, WalletsModule],
  providers: [BetsService],
  controllers: [BetsController],
  exports: [BetsService],
})
export class BetsModule {}
