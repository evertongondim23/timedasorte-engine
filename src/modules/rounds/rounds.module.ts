import { Module, forwardRef } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { RoundScheduleService } from './round-schedule.service';
import { RoundsSchedulerService } from './rounds-scheduler.service';
import { GameModule } from '../game/game.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { ResultsModule } from '../results/results.module';
import { ResultProviderModule } from '../result-provider/result-provider.module';

@Module({
  imports: [
    PrismaModule, 
    GameModule, 
    forwardRef(() => ResultsModule),
    ResultProviderModule,
  ],
  providers: [RoundsService, RoundScheduleService, RoundsSchedulerService],
  controllers: [RoundsController],
  exports: [RoundsService, RoundScheduleService],
})
export class RoundsModule {}
