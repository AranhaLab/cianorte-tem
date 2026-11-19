/**
 * Cálculo de valor de anúncio e lance mínimo (CLAUDE.md §9.2 e §9.3) — [PROPOSTA].
 * Hora = 8% da diária · semana = 7 × diária · mês = 30 × diária. Teto 30 dias.
 */
import type { Centavos, VagaAnuncio } from '@/types/domain';

export type UnidadeTempo = 'horas' | 'dias' | 'semanas' | 'mes';

export const UNIDADES: Record<
  UnidadeTempo,
  { rotulo: string; min: number; max: number; fator: number; diasPorUnidade: number }
> = {
  horas: { rotulo: 'Horas', min: 6, max: 72, fator: 0.08, diasPorUnidade: 1 / 24 },
  dias: { rotulo: 'Dias', min: 1, max: 30, fator: 1, diasPorUnidade: 1 },
  semanas: { rotulo: 'Semanas', min: 1, max: 4, fator: 7, diasPorUnidade: 7 },
  mes: { rotulo: '1 mês', min: 1, max: 1, fator: 30, diasPorUnidade: 30 },
};

export const INCREMENTO_LANCE: Centavos = 200; // R$ 2/dia

export const limitarQuantidade = (u: UnidadeTempo, q: number): number =>
  Math.min(Math.max(Math.round(q), UNIDADES[u].min), UNIDADES[u].max);

/** Valor de tabela do período escolhido. */
export function valorTabela(
  vaga: Pick<VagaAnuncio, 'precoDiaCentavos'>,
  u: UnidadeTempo,
  quantidade: number,
): Centavos {
  return Math.round(vaga.precoDiaCentavos * UNIDADES[u].fator * limitarQuantidade(u, quantidade));
}

export const diasEquivalentes = (u: UnidadeTempo, quantidade: number): number =>
  UNIDADES[u].diasPorUnidade * limitarQuantidade(u, quantidade);

/** Em disputa: lance atual + R$ 2. Livre ou ocupada: valor de tabela por dia. */
export function lanceMinimo(
  vaga: Pick<VagaAnuncio, 'status' | 'lanceAtualCentavos' | 'precoDiaCentavos'>,
): Centavos {
  return vaga.status === 'leilao' && vaga.lanceAtualCentavos !== null
    ? vaga.lanceAtualCentavos + INCREMENTO_LANCE
    : vaga.precoDiaCentavos;
}
