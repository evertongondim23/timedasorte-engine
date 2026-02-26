/**
 * Interfaces para respostas da API Asaas v3
 */

export interface AsaasWallet {
  id: string;
  name?: string;
  balance?: number;
  [key: string]: unknown;
}

export interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue?: number;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UNDEFINED';
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  [key: string]: unknown;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
  [key: string]: unknown;
}

export interface AsaasTransfer {
  id: string;
  value: number;
  status: string;
  [key: string]: unknown;
}

export type AsaasPixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

export interface CreatePaymentDto {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
}

export interface TransferToPixDto {
  value: number;
  pixAddressKey: string;
  pixAddressKeyType: AsaasPixKeyType;
  description?: string;
  scheduleDate?: string | null;
}

export interface TransferToWalletDto {
  value: number;
  walletId: string;
  description?: string;
}
