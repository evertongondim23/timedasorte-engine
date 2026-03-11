import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletsService } from './wallets.service';

const ASAAS_WEBHOOK_TOKEN_HEADER = 'asaas-access-token';

@Controller('asaas/webhooks')
export class AsaasWebhooksController {
  private readonly logger = new Logger(AsaasWebhooksController.name);

  constructor(
    private readonly walletsService: WalletsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Webhook de pagamentos do Asaas.
   * Configure no painel do Asaas para enviar eventos de pagamento para esta URL.
   * Se ASAAS_WEBHOOK_TOKEN estiver definido no .env, o header asaas-access-token é validado.
   */
  @Post('payments')
  @HttpCode(HttpStatus.OK)
  async handlePayment(
    @Headers(ASAAS_WEBHOOK_TOKEN_HEADER) accessToken: string | undefined,
    @Body() body: any,
  ) {
    const expectedToken = this.config.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (expectedToken && expectedToken.length > 0) {
      if (!accessToken || accessToken !== expectedToken) {
        this.logger.warn('Webhook Asaas rejeitado: token inválido ou ausente');
        throw new UnauthorizedException('Token de webhook inválido');
      }
    }

    const event = body?.event as string | undefined;
    const payment = body?.payment as
      | {
          id: string;
          value: number;
          status: string;
          billingType: string;
          externalReference?: string;
          description?: string;
        }
      | undefined;

    if (!payment || !payment.id) {
      this.logger.warn('Webhook Asaas recebido sem objeto de pagamento válido');
      return { received: false };
    }

    const relevantEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];
    const isRelevantEvent =
      (event && relevantEvents.includes(event)) ||
      payment.status === 'RECEIVED' ||
      payment.status === 'CONFIRMED';

    if (!isRelevantEvent) {
      this.logger.log(
        `Webhook Asaas ignorado: event=${event}, status=${payment.status}, paymentId=${payment.id}`,
      );
      return { received: true, ignored: true };
    }

    const allowedBillingTypes = ['PIX', 'BOLETO', 'CREDIT_CARD'];
    if (!allowedBillingTypes.includes(payment.billingType)) {
      this.logger.log(
        `Webhook Asaas ignorado (tipo não tratado): billingType=${payment.billingType}, paymentId=${payment.id}`,
      );
      return { received: true, ignored: true };
    }

    const userId = payment.externalReference;
    if (!userId) {
      this.logger.warn(
        `Webhook Asaas pagamento ${payment.id} sem externalReference (userId).`,
      );
      return { received: true, error: 'MISSING_EXTERNAL_REFERENCE' };
    }

    const amount = Number(payment.value);
    if (!amount || amount <= 0) {
      this.logger.warn(
        `Webhook Asaas pagamento ${payment.id} com valor inválido: ${payment.value}`,
      );
      return { received: true, error: 'INVALID_VALUE' };
    }

    try {
      const result = await this.walletsService.deposit(userId, {
        amount,
        description:
          payment.description ??
          `Depósito via PIX (Asaas) - pagamento ${payment.id}`,
        externalId: payment.id,
      });

      this.logger.log(
        `Depósito PIX Asaas processado: payment=${payment.id}, user=${userId}, value=${amount}`,
      );

      return {
        received: true,
        processed: true,
        walletId: result.wallet.id,
        transactionId: result.transaction.id,
      };
    } catch (error: any) {
      this.logger.error(
        `Erro ao processar webhook Asaas payment=${payment.id} para user=${userId}: ${
          error?.message ?? String(error)
        }`,
      );
      return { received: true, processed: false };
    }
  }
}

