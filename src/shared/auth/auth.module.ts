import { Global, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import {
  AuthService,
  RefreshTokenService,
  PasswordService,
  SessionService,
} from "./services";
import { JwtModule } from "@nestjs/jwt";
import { PasswordResetService } from "./services/password-reset.service";
import { EmailService } from "./services/email.service";
import { AuditService } from "./services/audit.service";
import { SecurityService } from "./services/security.service";
import { MetricsService } from "./services/metrics.service";
import { LoginService } from "./services/login.service";
import { AuthValidator } from "./validators/auth.validator";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthGuard } from "./guards/auth.guard";
import { RefreshGuard } from "./guards/refresh.guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { AuthInterceptor } from "./interceptors/auth.interceptor";
import { UsersModule } from "../../modules/users/users.module";

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: "15m", // Valor fixo para evitar erro de tipo
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: "JWT_CONFIG_LOGGER",
      useFactory: () => {
        return "JWT_CONFIG_LOGGED";
      },
    },
    AuthService,
    RefreshTokenService,
    PasswordService,
    SessionService,
    PasswordResetService,
    EmailService,
    AuditService,
    SecurityService,
    MetricsService,
    LoginService,
    AuthValidator,
    AuthGuard,
    RefreshGuard,
    RateLimitGuard,
    AuthInterceptor,
  ],
  exports: [
    JwtModule,
    AuthService,
    RefreshTokenService,
    PasswordService,
    SessionService,
    PasswordResetService,
    EmailService,
    AuditService,
    SecurityService,
    MetricsService,
    LoginService,
    AuthValidator,
    AuthGuard,
    RefreshGuard,
    RateLimitGuard,
    AuthInterceptor,
  ],
})
export class AuthModule {}
