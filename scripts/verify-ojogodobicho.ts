/**
 * Script para verificar a integração com o site de resultados.
 * Uso: npx ts-node scripts/verify-ojogodobicho.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.ojogodobicho.com/deu_no_poste.htm';

const categoryMap: Record<string, string> = {
  PTM: 'PTM',
  PPT: 'PPT',
  PT: 'PT',
  PTV: 'PTV',
  PTN: 'PTN',
  COR: 'COR',
};

interface ParsedResult {
  category: string;
  milhares: number[];
  dezenas: number[];
}

async function main() {
  console.log('🔍 Verificando integração com', BASE_URL);
  console.log('');

  try {
    const response = await axios.get(BASE_URL, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log('✅ Site acessível. Status:', response.status);
    console.log('');

    const $ = cheerio.load(response.data);
    const results: ParsedResult[] = [];
    const table = $('table').first();

    if (table.length === 0) {
      console.error('❌ Nenhuma tabela encontrada no HTML');
      process.exit(1);
    }

    const headers: string[] = [];
    table.find('thead tr th, thead tr td').each((_, el) => {
      const text = $(el).text().trim();
      if (categoryMap[text]) headers.push(text);
    });
    if (headers.length === 0) {
      table.find('tr').first().find('th, td').each((_, el) => {
        const text = $(el).text().trim();
        if (categoryMap[text]) headers.push(text);
      });
    }

    console.log('📋 Categorias encontradas no cabeçalho:', headers.join(', '));
    console.log('');

    table.find('tr').each((rowIndex, row) => {
      if (rowIndex === 0) return;
      const cells = $(row).find('td, th');
      const positionText = $(cells[0]).text().trim();
      const position = parseInt(positionText);
      if (isNaN(position) || position < 1 || position > 5) return;

      cells.each((colIndex, cell) => {
        if (colIndex === 0) return;
        const cellText = $(cell).text().trim();
        const headerIndex = colIndex - 1;
        if (headerIndex >= headers.length) return;
        const categoryName = headers[headerIndex];
        const category = categoryMap[categoryName];
        if (!category || !cellText) return;

        const match = cellText.match(/(\d{1,4})-(\d{1,2})/);
        if (match) {
          const milhar = parseInt(match[1].padStart(4, '0'));
          const dezena = parseInt(match[2]);
          let result = results.find((r) => r.category === category);
          if (!result) {
            result = { category, milhares: [], dezenas: [] };
            results.push(result);
          }
          result.milhares[position - 1] = milhar;
          result.dezenas[position - 1] = dezena;
        }
      });
    });

    if (results.length === 0) {
      console.log('⚠️ Nenhum resultado parseado. Verifique a estrutura da tabela.');
      process.exit(0);
    }

    console.log('✅ Resultados parseados com sucesso:\n');
    for (const r of results) {
      const complete =
        r.milhares.length === 5 && r.dezenas.length === 5 ? '✅' : '⚠️ incompleto';
      console.log(`  ${r.category} ${complete}`);
      console.log(`    Milhares: ${r.milhares.join(', ')}`);
      console.log(`    Dezenas: ${r.dezenas.join(', ')}`);
      console.log('');
    }

    console.log('🎯 Integração com o site de resultados está funcionando.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Erro:', msg);
    if (axios.isAxiosError(err)) {
      console.error('   Status:', err.response?.status);
      console.error('   URL:', err.config?.url);
    }
    process.exit(1);
  }
}

main();
