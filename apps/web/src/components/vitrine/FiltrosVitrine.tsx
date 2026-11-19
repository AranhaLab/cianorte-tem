import Link from 'next/link';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import type { Filtro, Ordem } from '@/lib/api';

/**
 * Ordenação e filtros mínimos (CLAUDE.md §5.1). São links com query string:
 * funcionam sem JavaScript, podem ser compartilhados e o servidor aplica o filtro.
 */
export function FiltrosVitrine({ base, ord, f }: { base: string; ord: Ordem; f?: Filtro }) {
  const url = (o: Ordem, filtro?: Filtro) => `${base}?ord=${o}${filtro ? `&f=${filtro}` : ''}`;
  const chip = (rotulo: string, href: string, on: boolean, icone?: NomeIcone) => (
    <Link
      key={rotulo}
      href={href}
      scroll={false}
      aria-current={on ? 'true' : undefined}
      className={`chip min-h-toque ${on ? 'chip-on' : ''}`}
    >
      {icone && <Icone nome={icone} tamanho="sm" />}
      {rotulo}
    </Link>
  );
  const alterna = (filtro: Filtro) => url(ord, f === filtro ? undefined : filtro);

  return (
    <div role="toolbar" aria-label="Ordenar e filtrar" className="sem-barra flex gap-2 overflow-x-auto pb-1">
      {chip('Mais vendidos', url('vendidos', f), ord === 'vendidos')}
      {chip('Menor preço', url('menor', f), ord === 'menor')}
      {chip('Maior desconto', url('desconto', f), ord === 'desconto')}
      {chip('Chega hoje', alterna('hoje'), f === 'hoje', 'truck')}
      {chip('Retirada na loja', alterna('retirada'), f === 'retirada', 'store')}
      {chip('Lojas oficiais', alterna('oficial'), f === 'oficial', 'shield')}
    </div>
  );
}

const ORDENS: Ordem[] = ['vendidos', 'menor', 'desconto'];
const FILTROS: Filtro[] = ['hoje', 'retirada', 'oficial'];

/** Lê ord/f da URL de forma segura (valores desconhecidos são ignorados). */
export function lerFiltros(sp: Record<string, string | string[] | undefined>, ordPadrao: Ordem = 'vendidos') {
  const ord = ORDENS.find((o) => o === sp.ord) ?? ordPadrao;
  const f = FILTROS.find((x) => x === sp.f);
  return { ord, f };
}
