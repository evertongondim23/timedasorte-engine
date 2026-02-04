import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { RoundCategory, ResultSource } from '@prisma/client';
import { IResultProvider, DrawResultData } from '../interfaces/result-provider.interface';

/**
 * 🎲 OJOGODOBICHO PROVIDER
 * 
 * Busca resultados do site https://www.ojogodobicho.com/deu_no_poste.htm
 * 
 * Formato esperado:
 * | PPT | PTM     | PT      | PTV     | PTN     | COR    |
 * | --- | ------- | ------- | ------- | ------- | ------ |
 * | 1   | 0199-25 | 4681-21 | 6233-9  | 8419-5  | 0000-0 |
 * 
 * Onde:
 * - Primeira coluna: posição (1-5)
 * - Demais colunas: milhar-dezena (ex: 0199-25 = milhar 0199, dezena 25)
 */

interface ParsedResult {
  category: RoundCategory;
  milhares: number[]; // [199, 4681, 6233, 8419, ...]
  dezenas: number[]; // [25, 21, 9, 5, ...]
}

@Injectable()
export class OJogoDoBichoProvider implements IResultProvider {
  private readonly logger = new Logger(OJogoDoBichoProvider.name);
  private readonly baseUrl = 'https://www.ojogodobicho.com/deu_no_poste.htm';

  getName(): string {
    return 'OJOGODOBICHO';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Site não disponível:', error.message);
      return false;
    }
  }

  async fetchResult(scheduledAt: Date, category?: RoundCategory): Promise<DrawResultData | null> {
    try {
      const results = await this.getLatestResult();
      
      // Se categoria foi especificada, buscar resultado específico
      if (category) {
        const categoryResult = results.find(r => r.category === category);
        if (categoryResult) {
          this.logger.log(`✅ Resultado encontrado para categoria ${category}: ${categoryResult.milhares.join(', ')}`);
          return {
            milhares: categoryResult.milhares,
            source: ResultSource.OFFICIAL,
            externalRef: `OJOGODOBICHO-${category}-${scheduledAt.toISOString()}`,
            fetchedAt: new Date(),
          };
        } else {
          this.logger.warn(`⚠️ Resultado não encontrado para categoria ${category}`);
          return null;
        }
      }
      
      // Se não especificou categoria, retorna o primeiro resultado encontrado
      if (results.length > 0) {
        const firstResult = results[0];
        this.logger.log(`✅ Resultado encontrado (primeiro disponível): ${firstResult.category} - ${firstResult.milhares.join(', ')}`);
        return {
          milhares: firstResult.milhares,
          source: ResultSource.OFFICIAL,
          externalRef: `OJOGODOBICHO-${firstResult.category}-${scheduledAt.toISOString()}`,
          fetchedAt: new Date(),
        };
      }
      
      this.logger.warn('⚠️ Nenhum resultado encontrado no site');
      return null;
    } catch (error) {
      this.logger.error('❌ Erro ao buscar resultado:', error);
      return null;
    }
  }

  validateResult(milhares: number[]): boolean {
    return (
      Array.isArray(milhares) &&
      milhares.length === 5 &&
      milhares.every((m) => m >= 0 && m <= 9999)
    );
  }

  /**
   * Busca o resultado mais recente do site
   */
  private async getLatestResult(): Promise<ParsedResult[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const results: ParsedResult[] = [];

      // Procurar pela tabela "deu no poste"
      const table = $('table').first();

      if (table.length === 0) {
        throw new Error('Tabela de resultados não encontrada');
      }

      // Mapear nomes das colunas para categorias
      const categoryMap: Record<string, RoundCategory> = {
        PTM: RoundCategory.PTM,
        PPT: RoundCategory.PPT,
        PT: RoundCategory.PT,
        PTV: RoundCategory.PTV,
        PTN: RoundCategory.PTN,
        COR: RoundCategory.COR,
      };

      // Pegar cabeçalho da tabela
      const headers: string[] = [];
      table.find('thead tr th, thead tr td').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text !== 'PPT' && text !== 'PTM' && text !== 'PT' && text !== 'PTV' && text !== 'PTN' && text !== 'COR') {
          // Pular colunas não relevantes
        } else if (text) {
          headers.push(text);
        }
      });

      // Se não encontrou no thead, procurar na primeira linha
      if (headers.length === 0) {
        table.find('tr').first().find('th, td').each((_, el) => {
          const text = $(el).text().trim();
          if (categoryMap[text]) {
            headers.push(text);
          }
        });
      }

      // Processar linhas de dados (posições 1-5)
      table.find('tr').each((rowIndex, row) => {
        if (rowIndex === 0) return; // Pular cabeçalho

        const cells = $(row).find('td, th');
        const positionText = $(cells[0]).text().trim();

        // Verificar se é uma linha de posição (1-5)
        const position = parseInt(positionText);
        if (isNaN(position) || position < 1 || position > 5) {
          return;
        }

        // Processar cada coluna de categoria
        cells.each((colIndex, cell) => {
          if (colIndex === 0) return; // Pular coluna de posição

          const cellText = $(cell).text().trim();
          const headerIndex = colIndex - 1;

          if (headerIndex < headers.length) {
            const categoryName = headers[headerIndex];
            const category = categoryMap[categoryName];

            if (category && cellText) {
              // Formato esperado: "0199-25" ou "199-25"
              const match = cellText.match(/(\d{1,4})-(\d{1,2})/);
              if (match) {
                const milhar = parseInt(match[1].padStart(4, '0'));
                const dezena = parseInt(match[2]);

                // Encontrar ou criar resultado para esta categoria
                let result = results.find((r) => r.category === category);
                if (!result) {
                  result = {
                    category,
                    milhares: [],
                    dezenas: [],
                  };
                  results.push(result);
                }

                // Adicionar na posição correta (0-4)
                result.milhares[position - 1] = milhar;
                result.dezenas[position - 1] = dezena;
              }
            }
          }
        });
      });

      // Validar que temos 5 milhares e 5 dezenas para cada categoria
      for (const result of results) {
        if (result.milhares.length !== 5 || result.dezenas.length !== 5) {
          throw new Error(
            `Resultado incompleto para categoria ${result.category}`,
          );
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Erro ao buscar resultado do site:', error);
      throw new Error(
        `Falha ao buscar resultado: ${error.message}`,
      );
    }
  }

}
