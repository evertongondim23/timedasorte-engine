import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module'; 
import { CustomLoggerService } from './shared/common/logger/logger.service';
import { MetricsInterceptor } from './shared/common/interceptors/metrics.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { runSeed } from 'prisma/seed';

async function bootstrap() {
  try { 
    runSeed();

    const app = await NestFactory.create(AppModule, {
      // Importante: Habilitar CORS na criação do app para WebSockets
      cors: true,
    });
    const logger = app.get(CustomLoggerService);

    // CRITICAL: Configurar WebSocket adapter ANTES de qualquer outra coisa
    app.useWebSocketAdapter(new IoAdapter(app));

    // Configurar CORS detalhado para HTTP
    app.enableCors({
      origin: [
        'https://appjogo-da-sorte.com',
        'http://31.97.166.94',           // Nginx proxy
        'http://localhost:3005',          // Para desenvolvimento local
        'http://localhost:3006',          // Para desenvolvimento local
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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
