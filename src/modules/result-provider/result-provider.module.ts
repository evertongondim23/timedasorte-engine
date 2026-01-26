import { Module } from '@nestjs/common';
import { ResultProviderService } from './result-provider.service';
import { AdminProvider } from './providers/admin.provider';
import { OfficialProvider } from './providers/official.provider';

@Module({
  providers: [
    ResultProviderService,
    AdminProvider,
    OfficialProvider,
  ],
  exports: [ResultProviderService],
})
export class ResultProviderModule {}
