import { Module } from '@nestjs/common';
import { ResultProviderService } from './result-provider.service';
import { AdminProvider } from './providers/admin.provider';
import { OfficialProvider } from './providers/official.provider';
import { OJogoDoBichoProvider } from './providers/ojogodobicho.provider';

@Module({
  providers: [
    ResultProviderService,
    AdminProvider,
    OfficialProvider,
    OJogoDoBichoProvider,
  ],
  exports: [ResultProviderService],
})
export class ResultProviderModule {}
