# Integração Asaas – Jogo da Sorte

Integração com a API Asaas para depósitos (cobrança PIX) e saques (transferência PIX), usando a **carteira (wallet)** da aplicação.

## Variáveis de ambiente

Adicione ao seu `.env`:

```env
# Asaas (pagamentos PIX)
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_WALLET_ID=cf4340a1-5c26-4f48-8f78-cec1dc40b27d
ASAAS_CUSTOMER_ID=cus_xxxxxxxx
# Opcional: production | sandbox (default)
ASAAS_ENVIRONMENT=sandbox
```

- **ASAAS_API_KEY**: Chave de API (token de acesso) no painel Asaas.
- **ASAAS_WALLET_ID**: ID da carteira onde os pagamentos são recebidos e de onde saem os saques PIX. Valor padrão: `cf4340a1-5c26-4f48-8f78-cec1dc40b27d`.
- **ASAAS_CUSTOMER_ID**: ID do cliente (customer) usado para criar cobranças PIX de depósito. Crie um cliente no Asaas e use o ID aqui.
- **ASAAS_ENVIRONMENT**: `sandbox` (default) ou `production`. Em produção use `https://api.asaas.com`.

## Fluxos

### Depósito via PIX

1. Cliente chama `POST /wallets/me/deposit-request` com `{ "amount": 50, "description": "opcional" }`.
2. O backend cria uma cobrança PIX no Asaas e retorna `paymentId`, `pixQrCode` (imagem base64 + payload) e `paymentLink`.
3. Usuário paga o PIX; quando o pagamento for confirmado, o **webhook** do Asaas chama o backend e o saldo é creditado automaticamente.

#### Configurar webhook no Asaas (obrigatório para creditar após o PIX)

Sem o webhook configurado, o Asaas **não avisa** o backend quando o PIX é pago, e o saldo não é creditado.

1. Acesse o painel do Asaas (produção ou sandbox): [Asaas](https://www.asaas.com/) ou [Sandbox](https://sandbox.asaas.com/).
2. Vá em **Integrações** → **Webhooks** (ou **Configurações** → **Webhooks**).
3. Crie um novo webhook com:
   - **URL**: `https://SEU_DOMINIO/asaas/webhooks/payments`  
     Exemplo em produção: `https://api.seudominio.com/asaas/webhooks/payments`  
     Em desenvolvimento local use um túnel (ngrok, Cloudflare Tunnel) e informe a URL pública.
   - **Eventos**: marque pelo menos:
     - `PAYMENT_RECEIVED`
     - `PAYMENT_CONFIRMED`
4. (Opcional) Defina um **Token de acesso** e valide o header `asaas-access-token` no backend para maior segurança.

O backend já expõe `POST /asaas/webhooks/payments`, processa esses eventos, credita a carteira e evita duplicata por `externalId`. Documentação Asaas: [Receba eventos no seu endpoint](https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook).

### Saque via PIX

1. Cliente chama `POST /wallets/me/withdraw` com `{ "amount": 100, "method": "PIX", "pixKey": "cpf_ou_email_ou_telefone" }`.
2. O backend debita o saldo na carteira interna e, se a integração Asaas estiver ativa, dispara a transferência PIX para a chave informada.
3. O tipo de chave (CPF, CNPJ, EMAIL, PHONE) é inferido automaticamente; em caso de dúvida, pode ser estendido o DTO para aceitar `pixKeyType` explicitamente.

## Documentação Asaas

- [Documentação geral](https://docs.asaas.com/)
- [Sandbox](https://sandbox.asaas.com/)
- [Transferência para conta Asaas](https://docs.asaas.com/docs/transfer-to-asaas-account)
- [Transferência PIX/TED](https://docs.asaas.com/docs/transfer-to-accounts-at-another-institution-pix-ted)
- [Criar pagamento](https://docs.asaas.com/reference/create-new-payment)
