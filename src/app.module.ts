import {
  Module,
  NestModule,
  MiddlewareConsumer,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// ===============================================
// 🔐 MÓDULOS DE AUTENTICAÇÃO E USUÁRIOS
// ===============================================
import { AuthModule } from "./shared/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CompaniesModule } from "./modules/companies/companies.module";

// ===============================================
// 🏗️ MÓDULOS DE INFRAESTRUTURA COMPARTILHADA
// ===============================================
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { LoggerModule } from "./shared/common/logger/logger.module";
import { MessagesModule } from "./shared/common/messages/messages.module";
import { PrismaModule } from "./shared/prisma/prisma.module";
import { CaslModule } from "./shared/casl/casl.module";
import { TenantModule } from "./shared/tenant/tenant.module";
import { UniversalModule } from "./shared/universal/universal.module";
import { FilesModule } from "./shared/files/files.module";
// import { NotificationModule } from './modules/notifications/notification.module'; // TODO: Criar módulo de notificações

// ===============================================
// 🛡️ MIDDLEWARE E INTERCEPTORS
// ===============================================
import { RateLimitMiddleware } from "./shared/common/middleware/rate-limit.middleware";
import { SoftDeleteInterceptor } from "./shared/interceptors/soft-delete.interceptor";

// ===============================================
// 🎯 FILTROS DE ERRO
// ===============================================
import {
  HttpExceptionFilter,
  ForbiddenErrorFilter,
  NotFoundErrorFilter,
  ConflictErrorFilter,
  UnauthorizedErrorFilter,
  ValidationErrorFilter,
  InvalidCredentialsErrorFilter,
  AuthErrorFilter,
  RequiredFieldErrorFilter,
  PrismaErrorFilter,
} from "./shared/common/filters";

// ===============================================
// 🎲 MÓDULOS DO JOGO DA SORTE
// ===============================================
import { GameModule } from "./modules/game/game.module";
import { RoundsModule } from "./modules/rounds/rounds.module";
import { BetsModule } from "./modules/bets/bets.module";
import { ResultsModule } from "./modules/results/results.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ResultProviderModule } from "./modules/result-provider/result-provider.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
// TODO: Importar módulos quando criados:
// import { BetsModule } from './modules/bets/bets.module';
// import { DrawsModule } from './modules/draws/draws.module';
// import { PaymentGatewaysModule } from './modules/payment-gateways/payment-gateways.module';

@Module({
  imports: [
    // ===============================================
    // ⚙️ CONFIGURAÇÃO GLOBAL
    // ===============================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),

    // ===============================================
    // 🏗️ MÓDULOS DE INFRAESTRUTURA
    // ===============================================
    LoggerModule,
    MessagesModule,
    PrismaModule,
    CaslModule,
    TenantModule,
    UniversalModule,
    PrometheusModule.register(),

    // ===============================================
    // 🔐 AUTENTICAÇÃO E USUÁRIOS
    // ===============================================
    AuthModule,
    UsersModule,
    CompaniesModule,

    // ===============================================
    // 📁 ARQUIVOS E NOTIFICAÇÕES
    // ===============================================
    FilesModule,
    // NotificationModule, // TODO: Adicionar quando módulo for criado

    // ===============================================
    // 🎲 MÓDULOS DO JOGO
    // ===============================================
    GameModule,
    RoundsModule,
    BetsModule,
    ResultsModule,
    AdminModule,
    ResultProviderModule,
    WalletsModule,
    TeamsModule,
    TransactionsModule,
    // TODO: Adicionar outros módulos quando criados:
    // PaymentGatewaysModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // ===============================================
    // 🔧 PIPES GLOBAIS
    // ===============================================
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },

    // ===============================================
    // 🔄 INTERCEPTORS GLOBAIS
    // ===============================================
    {
      provide: APP_INTERCEPTOR,
      useClass: SoftDeleteInterceptor,
    },

    // ===============================================
    // 🎯 FILTROS DE ERRO GLOBAIS
    // ===============================================
    {
      provide: APP_FILTER,
      useClass: PrismaErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ForbiddenErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: RequiredFieldErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ConflictErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UnauthorizedErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: InvalidCredentialsErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AuthErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes("*");
  }
}
