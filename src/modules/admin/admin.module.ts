import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { RoundsModule } from '../rounds/rounds.module';

@Module({
  imports: [RoundsModule],
  controllers: [AdminController],
})
export class AdminModule {}
