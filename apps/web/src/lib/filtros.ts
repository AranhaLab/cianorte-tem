/**
 * Filtros da vitrine na URL (compartilháveis e funcionam sem JavaScript):
 *   ?ord=menor&f=hoje&sub=camisaria&marca=Vale Azul,Linho Cru&loja=vale-azul&car=Algodão&min=50&max=200
 * Preço na URL em reais inteiros; dentro do app em centavos.
 */
import type { FiltrosLaterais } from '@/lib/api';
import { lerChaveAtributo } from '@/lib/regras/atributos';

type Params = Record<string, string | string[] | undefined>;

const lista = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(',') : (v ?? ''))
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);

const reaisParaCentavos = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= 0 && v !== undefined && v !== '' ? Math.round(n * 100) : undefined;
};

export function lerLaterais(sp: Params): FiltrosLaterais {
  const sub = typeof sp.sub === 'string' && sp.sub ? sp.sub : undefined;
  return {
    sub,
    marcas: lista(sp.marca),
    lojas: lista(sp.loja),
    caracteristicas: lista(sp.car),
    ...(sp.at ? { atributos: (Array.isArray(sp.at) ? sp.at : [sp.at]).filter((x) => !!lerChaveAtributo(x)).slice(0, 40) } : {}),
    precoMin: reaisParaCentavos(sp.min),
    precoMax: reaisParaCentavos(sp.max),
  };
}

/** Monta a URL com os filtros; valores vazios saem da URL. */
export function urlFiltros(
  base: string,
  q: { ord?: string; f?: string; q?: string } & FiltrosLaterais,
): string {
  const u = new URLSearchParams();
  if (q.q) u.set('q', q.q);
  if (q.ord) u.set('ord', q.ord);
  if (q.f) u.set('f', q.f);
  if (q.sub) u.set('sub', q.sub);
  if (q.marcas?.length) u.set('marca', q.marcas.join(','));
  if (q.lojas?.length) u.set('loja', q.lojas.join(','));
  if (q.caracteristicas?.length) u.set('car', q.caracteristicas.join(','));
  q.atributos?.forEach((atributo) => u.append('at', atributo));
  if (q.precoMin !== undefined) u.set('min', String(Math.floor(q.precoMin / 100)));
  if (q.precoMax !== undefined) u.set('max', String(Math.ceil(q.precoMax / 100)));
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

/** Quantos filtros do painel lateral estão ativos (para o rótulo "Filtros (3)"). */
export const totalAtivos = (f: FiltrosLaterais) =>
  (f.marcas?.length ?? 0) +
  (f.lojas?.length ?? 0) +
  (f.caracteristicas?.length ?? 0) +
  (f.atributos?.length ?? 0) +
  (f.precoMin !== undefined ? 1 : 0) +
  (f.precoMax !== undefined ? 1 : 0);
