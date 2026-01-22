import { Module } from '@nestjs/common';
import { GameConfigService } from './game-config.service';
import { GameController } from './game.controller';

@Module({
  providers: [GameConfigService],
  controllers: [GameController],
  exports: [GameConfigService],
})
export class GameModule {}
