import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module'; 
import { CustomLoggerService } from './shared/common/logger/logger.service';
import { MetricsInterceptor } from './shared/common/interceptors/metrics.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { runSeed } from 'prisma/seed';

function parseCorsOrigins(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  try {
    await runSeed();

    const app = await NestFactory.create(AppModule);
    const logger = app.get(CustomLoggerService);

    // CRITICAL: Configurar WebSocket adapter ANTES de qualquer outra coisa
    app.useWebSocketAdapter(new IoAdapter(app));

    const envCorsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
    const defaultCorsOrigins = [
      'https://timedasorte-app.lobocode.com.br',
      'https://timedasorte-api.lobocode.com.br',
      'http://31.97.166.94', // Nginx proxy
      'http://localhost:3100', // Desenvolvimento local
    ];

    // CORS único (evitar cors: true + enableCors). WebSockets usam IoAdapter separado.
    app.enableCors({
      origin: [...new Set([...envCorsOrigins, ...defaultCorsOrigins])],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      // Preflight envia Access-Control-Request-Headers; lista curta faz o browser falhar o CORS
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language',
        'X-Requested-With',
        'Origin',
      ],
      exposedHeaders: ['Content-Length', 'X-Request-Id'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        whitelist: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: false,
      }),
    );
    
    app.useGlobalInterceptors(new MetricsInterceptor());

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    
    logger.log(`🚀 Aplicação iniciada na porta ${port}`, 'Bootstrap');
    logger.log(`🔌 WebSocket habilitado em ws://localhost:${port}`, 'Bootstrap');
    logger.log(`📡 Gateway de notificações: ws://localhost:${port}`, 'Bootstrap');
    logger.log(`📊 Health check disponível em http://localhost:${port}/health`, 'Bootstrap');
    logger.log(`📈 Métricas disponíveis em http://localhost:${port}/metrics`, 'Bootstrap');
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}
bootstrap();
