import { Module, forwardRef } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { GameModule } from '../game/game.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [
    PrismaModule, 
    GameModule, 
    forwardRef(() => ResultsModule),
  ],
  providers: [RoundsService],
  controllers: [RoundsController],
  exports: [RoundsService],
})
export class RoundsModule {}
