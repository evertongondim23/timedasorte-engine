import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [PrismaModule, GameModule],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
