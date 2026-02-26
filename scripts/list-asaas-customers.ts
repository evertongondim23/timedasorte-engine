/**
 * Lista clientes do Asaas (produção ou sandbox) para obter o ID a usar em ASAAS_CUSTOMER_ID.
 * Uso: npm run asaas:customers
 *
 * Requer no .env: ASAAS_API_KEY e opcionalmente ASAAS_ENVIRONMENT=production
 */

/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (process.env[m[1]] == null) process.env[m[1]] = val;
  }
}
loadEnv();

const ASAAS_PRODUCTION_URL = 'https://api.asaas.com';
const ASAAS_SANDBOX_URL = 'https://api-sandbox.asaas.com';

async function main() {
  const apiKey = process.env.ASAAS_API_KEY || process.env.ASAAS_ACCESS_TOKEN;
  if (!apiKey) {
    console.error('❌ Defina ASAAS_API_KEY no .env');
    process.exit(1);
  }

  const isProduction = process.env.ASAAS_ENVIRONMENT === 'production';
  const baseUrl = isProduction ? ASAAS_PRODUCTION_URL : ASAAS_SANDBOX_URL;
  console.log(`📋 Listando clientes do Asaas (${isProduction ? 'PRODUÇÃO' : 'SANDBOX'})...\n`);

  const client = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json', access_token: apiKey },
  });

  try {
    const res = await client.get<{ data: Array<{ id: string; name: string; email?: string; cpfCnpj?: string }> }>(
      '/v3/customers',
      { params: { limit: 100 } },
    );
    const customers = res.data?.data ?? [];
    if (customers.length === 0) {
      console.log('Nenhum cliente encontrado.');
      console.log('\n👉 Crie um cliente no painel Asaas ou via API e use o ID em ASAAS_CUSTOMER_ID no .env.');
      return;
    }
    console.log('ID (use em ASAAS_CUSTOMER_ID)     | Nome              | Email / CPF/CNPJ');
    console.log('-'.repeat(80));
    for (const c of customers) {
      const id = (c.id ?? '').padEnd(28);
      const name = ((c.name ?? '-').slice(0, 18)).padEnd(18);
      const extra = [c.email, c.cpfCnpj].filter(Boolean).join(' / ') || '-';
      console.log(`${id} | ${name} | ${extra}`);
    }
    console.log('\n👉 Copie o ID desejado e defina no .env: ASAAS_CUSTOMER_ID=<id>');
  } catch (err: unknown) {
    const ax = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: unknown } }).response : null;
    if (ax?.status === 401) {
      console.error('❌ Chave de API inválida. Verifique ASAAS_API_KEY no .env (use aspas se começar com $).');
    } else if (ax?.status === 400) {
      console.error('❌ Requisição inválida:', JSON.stringify(ax.data, null, 2));
    } else {
      console.error('❌ Erro ao listar clientes:', ax?.data ?? err);
    }
    process.exit(1);
  }
}

main();
