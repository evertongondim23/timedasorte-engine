import { Module } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { GameModule } from '../game/game.module';
import { PrismaModule } from '@/shared/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule, GameModule],
  providers: [RoundsService],
  controllers: [RoundsController],
  exports: [RoundsService],
})
export class RoundsModule {}
