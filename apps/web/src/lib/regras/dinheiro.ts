import type { Centavos, Produto } from '@/types/domain';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 8990 → "R$ 89,90". Dinheiro é sempre inteiro em centavos. */
export const reais = (c: Centavos): string => BRL.format(c / 100).replace(/ /g, ' ');

/** Percentual de desconto inteiro (0 se não há preço "de"). */
export const desconto = (p: Pick<Produto, 'precoCentavos' | 'precoDeCentavos'>): number =>
  p.precoDeCentavos ? Math.round((1 - p.precoCentavos / p.precoDeCentavos) * 100) : 0;

/** "R$ 1.234,56" ou "1234,56" → centavos. Retorna NaN se inválido. */
export function paraCentavos(texto: string): Centavos {
  const limpo = texto
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const v = Number(limpo);
  return Number.isFinite(v) && limpo !== '' ? Math.round(v * 100) : NaN;
}
