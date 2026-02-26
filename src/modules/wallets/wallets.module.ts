import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { AsaasWebhooksController } from './asaas-webhooks.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WalletsController, AsaasWebhooksController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}

