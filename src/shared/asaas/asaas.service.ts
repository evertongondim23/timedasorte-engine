import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { ASAAS_SANDBOX_URL, ASAAS_PRODUCTION_URL } from "./asaas.constants";
import type {
  AsaasWallet,
  AsaasPayment,
  AsaasPixQrCode,
  AsaasTransfer,
  CreatePaymentDto,
  TransferToPixDto,
  TransferToWalletDto,
} from "./interfaces/asaas.interface";

@Injectable()
export class AsaasService implements OnModuleInit {
  private readonly logger = new Logger(AsaasService.name);
  private client!: AxiosInstance;
  private apiKey: string = "";
  private baseUrl: string = ASAAS_PRODUCTION_URL;
  private walletId: string = "";
  private customerId: string = "";

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.apiKey =
      this.config.get<string>("ASAAS_API_KEY") ||
      this.config.get<string>("ASAAS_ACCESS_TOKEN") ||
      "";
    this.walletId =
      this.config.get<string>("ASAAS_WALLET_ID") ||
      "cf4340a1-5c26-4f48-8f78-cec1dc40b27d";
    this.customerId = this.config.get<string>("ASAAS_CUSTOMER_ID") || "";
    const isProduction =
      this.config.get<string>("ASAAS_ENVIRONMENT") === "production";
    this.baseUrl = isProduction ? ASAAS_PRODUCTION_URL : ASAAS_SANDBOX_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        access_token: this.apiKey,
      },
    });

    if (!this.apiKey) {
      this.logger.warn(
        "ASAAS_API_KEY não configurada. Integração Asaas desabilitada.",
      );
    } else {
      this.logger.log(
        `Asaas inicializado (${isProduction ? "produção" : "sandbox"}), wallet: ${this.walletId}`,
      );
    }
  }

  /** Verifica se a integração está ativa */
  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  /** Retorna o Wallet ID da aplicação */
  getWalletId(): string {
    return this.walletId;
  }

  /** Retorna o Customer ID usado para cobranças (depósitos PIX) */
  getCustomerId(): string {
    return this.customerId;
  }

  /**
   * Lista carteiras (contas) - retorna saldo quando disponível na resposta
   * GET /v3/wallets/
   */
  async getWallets(): Promise<AsaasWallet[]> {
    this.ensureEnabled();
    const { data } = await this.client.get<{ data?: AsaasWallet[] }>(
      "/v3/wallets/",
    );
    const list = Array.isArray(data)
      ? data
      : ((data as { data?: AsaasWallet[] }).data ?? []);
    return list;
  }

  /**
   * Consulta saldo da carteira da aplicação (por walletId)
   * A API pode retornar saldo em GET /v3/wallets/; filtramos pelo nosso walletId
   */
  async getWalletBalance(): Promise<{
    balance: number;
    walletId: string;
  } | null> {
    this.ensureEnabled();
    const wallets = await this.getWallets();
    const wallet = wallets.find((w) => w.id === this.walletId);
    if (!wallet) {
      this.logger.warn(
        `Carteira Asaas ${this.walletId} não encontrada na listagem`,
      );
      return null;
    }
    const balance =
      typeof (wallet as AsaasWallet & { balance?: number }).balance === "number"
        ? (wallet as AsaasWallet & { balance: number }).balance
        : 0;
    return { balance, walletId: wallet.id };
  }

  /**
   * Cria uma cobrança (pagamento) - ex.: PIX para depósito
   * POST /v3/payments
   */
  async createPayment(params: CreatePaymentDto): Promise<AsaasPayment | null> {
    this.ensureEnabled();
    const { data } = await this.client.post<AsaasPayment>("/v3/payments", {
      customer: params.customer,
      billingType: params.billingType,
      value: params.value,
      dueDate: params.dueDate,
      description: params.description ?? undefined,
      externalReference: params.externalReference ?? undefined,
    });
    return data;
  }

  /**
   * Obtém QR Code PIX de um pagamento
   * GET /v3/payments/{id}/pixQrCode
   */
  async getPaymentPixQrCode(paymentId: string): Promise<AsaasPixQrCode | null> {
    this.ensureEnabled();
    const { data } = await this.client.get<AsaasPixQrCode>(
      `/v3/payments/${paymentId}/pixQrCode`,
    );
    return data;
  }

  /**
   * Consulta um pagamento
   * GET /v3/payments/{id}
   */
  async getPayment(paymentId: string): Promise<AsaasPayment | null> {
    this.ensureEnabled();
    const { data } = await this.client.get<AsaasPayment>(
      `/v3/payments/${paymentId}`,
    );
    return data;
  }

  /**
   * Transfere valor para outra carteira Asaas (walletId)
   * POST /v3/transfers/
   */
  async transferToWallet(
    params: TransferToWalletDto,
  ): Promise<AsaasTransfer | null> {
    this.ensureEnabled();
    const { data } = await this.client.post<AsaasTransfer>("/v3/transfers/", {
      value: params.value,
      walletId: params.walletId,
      description: params.description ?? undefined,
    });
    return data;
  }

  /**
   * Transfere valor via PIX para chave (CPF, CNPJ, e-mail, telefone, EVP)
   * POST /v3/transfers/
   */
  async transferToPix(params: TransferToPixDto): Promise<AsaasTransfer | null> {
    this.ensureEnabled();
    const { data } = await this.client.post<AsaasTransfer>("/v3/transfers/", {
      value: params.value,
      pixAddressKey: params.pixAddressKey.replace(/\D/g, ""),
      pixAddressKeyType: params.pixAddressKeyType,
      description: params.description ?? undefined,
      scheduleDate: params.scheduleDate ?? null,
    });
    return data;
  }

  private ensureEnabled(): void {
    if (!this.apiKey) {
      throw new Error(
        "Integração Asaas não configurada. Defina ASAAS_API_KEY no ambiente.",
      );
    }
  }
}
