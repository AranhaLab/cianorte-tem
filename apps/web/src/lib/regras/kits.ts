/**
 * Regras de kits (PRD-05, CLAUDE.md §5.3):
 * - kit tem ao menos 2 produtos DISTINTOS, todos da mesma loja;
 * - o kit consome o estoque dos componentes (não tem estoque próprio);
 * - a demanda de kits e de itens avulsos é somada por produto.
 */
import type { ComponenteKit, Disponibilidade, ItemSacola, Kit, Produto } from '@/types/domain';

export const MAX_MIDIAS = 20; // galeria do produto (CLAUDE.md §16)

/** Kit válido: ≥ 2 produtos distintos, todos da loja do kit, mínimo/máximo coerentes. */
export function kitValido(kit: Kit, lojaDoKit: string, produtos: Pick<Produto, 'id' | 'lojaId'>[]): boolean {
  const ids = new Set(kit.componentes.map((c) => c.produtoId));
  if (ids.size < 2) return false;
  if (kit.componentes.some((c) => c.quantidade < 1)) return false;
  if (![...ids].every((id) => produtos.find((p) => p.id === id)?.lojaId === lojaDoKit)) return false;
  if (kit.tipo === 'aberto' && (kit.minimoItens < 2 || kit.maximoItens < kit.minimoItens)) return false;
  return true;
}

const ORDEM: Record<Disponibilidade, number> = { disponivel: 0, ultimas_unidades: 1, indisponivel: 2 };

/** Disponibilidade do kit fechado = a pior entre os componentes. */
export function disponibilidadeKit(componentes: Disponibilidade[]): Disponibilidade {
  return componentes.reduce<Disponibilidade>((pior, d) => (ORDEM[d] > ORDEM[pior] ? d : pior), 'disponivel');
}

/** Kit aberto: soma dos escolhidos com o desconto do kit, arredondada no fim. [PROPOSTA] */
export function precoKitAberto(
  escolhidos: Array<{ precoCentavos: number; quantidade: number }>,
  descontoPercentual: number,
): number {
  const soma = escolhidos.reduce((a, e) => a + e.precoCentavos * e.quantidade, 0);
  return Math.round(soma * (1 - descontoPercentual / 100));
}

/** Menor preço possível do kit aberto (os N itens mais baratos disponíveis) — "a partir de". */
export function precoMinimoKitAberto(
  kit: Kit,
  opcoes: Pick<Produto, 'id' | 'precoCentavos' | 'disponibilidade'>[],
): number {
  const precos = kit.componentes
    .map((c) => opcoes.find((o) => o.id === c.produtoId))
    .filter((o): o is NonNullable<typeof o> => !!o && o.disponibilidade !== 'indisponivel')
    .map((o) => ({ precoCentavos: o.precoCentavos, quantidade: 1 }))
    .sort((a, b) => a.precoCentavos - b.precoCentavos)
    .slice(0, kit.minimoItens);
  return precoKitAberto(precos, kit.descontoPercentual);
}

/** Escolha do kit aberto respeita mínimo, máximo e só usa opções do kit. */
export function escolhaValida(kit: Kit, escolhidos: string[]): boolean {
  const unicos = new Set(escolhidos);
  return (
    unicos.size === escolhidos.length &&
    unicos.size >= kit.minimoItens &&
    unicos.size <= kit.maximoItens &&
    escolhidos.every((id) => kit.componentes.some((c) => c.produtoId === id))
  );
}

/**
 * Quanto de cada produto a sacola compromete, somando itens avulsos e
 * componentes de kits (PRD-05). O servidor usa a mesma conta para reservar estoque.
 */
export function demandaPorProduto(
  itens: ItemSacola[],
  kits: Record<string, Kit | null | undefined>,
): Record<string, number> {
  const d: Record<string, number> = {};
  const somar = (id: string, n: number) => (d[id] = (d[id] ?? 0) + n);
  for (const item of itens) {
    const kit = kits[item.produtoId];
    const comps: ComponenteKit[] | undefined =
      item.composicao ?? (kit?.tipo === 'fechado' ? kit.componentes : undefined);
    if (comps) comps.forEach((c) => somar(c.produtoId, c.quantidade * item.quantidade));
    else somar(item.produtoId, item.quantidade);
  }
  return d;
}
