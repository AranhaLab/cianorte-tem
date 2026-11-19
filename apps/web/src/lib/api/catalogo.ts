/**
 * Leituras públicas do catálogo (SSR/ISR). Contratos: CLAUDE.md §11.
 * O parâmetro `cep` existe para o back-end calcular cobertura, frete e retirada.
 */
import { CATALOGO } from '@/mocks/catalogo';
import { CRIATIVOS, VAGAS } from '@/mocks/anuncios';
import { TENANTS } from '@/mocks/tenants';
import type { Categoria, CriativoAnuncio, Loja, Produto, Tenant } from '@/types/domain';
import { mock } from './http';
import { desconto } from '@/lib/regras/dinheiro';

const cat = (t: string) => CATALOGO[t] ?? { categorias: [], lojas: [], produtos: [] };
const visiveis = (t: string) => cat(t).produtos.filter((p) => cat(t).lojas.some((l) => l.id === p.lojaId));

export type Ordem = 'vendidos' | 'menor' | 'desconto';
export type Filtro = 'hoje' | 'retirada' | 'oficial';

function ordenar(lista: Produto[], ordem: Ordem = 'vendidos'): Produto[] {
  const l = [...lista];
  if (ordem === 'menor') return l.sort((a, b) => a.precoCentavos - b.precoCentavos);
  if (ordem === 'desconto') return l.sort((a, b) => desconto(b) - desconto(a));
  return l.sort((a, b) => b.vendidos - a.vendidos);
}

function filtrar(t: string, lista: Produto[], filtro?: Filtro): Produto[] {
  const loja = (id: string) => cat(t).lojas.find((l) => l.id === id);
  if (filtro === 'hoje') return lista.filter((p) => /Hoje|Em 2/.test(loja(p.lojaId)?.prazo ?? ''));
  if (filtro === 'retirada') return lista.filter((p) => loja(p.lojaId)?.retirada);
  if (filtro === 'oficial') return lista.filter((p) => loja(p.lojaId)?.selo === 'oficial');
  return lista;
}

export const tenant = {
  /** GET /v1/tenant (resolvido pelo domínio) */
  obter: (slug: string): Promise<Tenant | null> => mock(TENANTS[slug] ?? null),
};

export interface VitrineHome {
  maisVendidos: Produto[];
  melhoresPrecos: Produto[];
  emAlta: Produto[];
  confeccoes: Produto[];
  lojas: Loja[];
  anuncios: CriativoAnuncio[];
}

export interface VitrineCategoria {
  categoria: Categoria;
  produtos: Produto[]; // já filtrados e ordenados
  total: number;
  maisVendidos: Produto[];
  melhoresPrecos: Produto[];
  lojas: Loja[];
  anuncios: CriativoAnuncio[];
}

export const vitrine = {
  /** GET /v1/vitrine/home — seções + anúncios ativos por vaga */
  home: (t: string): Promise<VitrineHome> => {
    const ps = visiveis(t).filter((p) => p.disponibilidade !== 'indisponivel');
    return mock({
      maisVendidos: ordenar(ps).slice(0, 10),
      melhoresPrecos: ordenar(
        ps.filter((p) => p.precoDeCentavos),
        'desconto',
      ).slice(0, 10),
      emAlta: [...visiveis(t)].sort((a, b) => b.emAlta - a.emAlta).slice(0, 8),
      confeccoes: visiveis(t)
        .filter((p) => p.categoriaId === 'moda' || p.lojaId === 'vale-azul')
        .slice(0, 8),
      lojas: cat(t).lojas.slice(0, 8),
      anuncios: (CRIATIVOS[t] ?? []).filter((a) => ['H1', 'M1', 'M2', 'C1'].includes(a.vaga)),
    });
  },

  /** GET /v1/categorias/{id}/vitrine?ord=&f=&cep= */
  categoria: (
    t: string,
    id: string,
    q: { ord?: Ordem; f?: Filtro; cep?: string } = {},
  ): Promise<VitrineCategoria | null> => {
    const categoria = cat(t).categorias.find((c) => c.id === id);
    if (!categoria) return mock(null);
    const todos = visiveis(t).filter((p) => p.categoriaId === id);
    return mock({
      categoria,
      produtos: ordenar(filtrar(t, todos, q.f), q.ord),
      total: todos.length,
      maisVendidos: ordenar(todos),
      melhoresPrecos: ordenar(todos, 'menor'),
      lojas: cat(t).lojas.filter((l) => todos.some((p) => p.lojaId === l.id)),
      anuncios: (CRIATIVOS[t] ?? []).filter((a) => a.vaga === 'K1' || a.vaga === 'L1'),
    });
  },
};

export const categorias = {
  /** GET /v1/categorias */
  listar: (t: string): Promise<Array<Categoria & { totalProdutos: number }>> =>
    mock(
      cat(t).categorias.map((c) => ({
        ...c,
        totalProdutos: visiveis(t).filter((p) => p.categoriaId === c.id).length,
      })),
    ),
};

export const produtos = {
  /** GET /v1/produtos?q=&cat=&ord=&f=&cep=&pagina= */
  buscar: (
    t: string,
    q: { q?: string; cat?: string; ord?: Ordem; f?: Filtro; soOfertas?: boolean } = {},
  ): Promise<Produto[]> => {
    const termo = (q.q ?? '').trim().toLowerCase();
    let lista = visiveis(t).filter((p) => {
      if (q.cat && p.categoriaId !== q.cat) return false;
      if (q.soOfertas && !p.precoDeCentavos) return false;
      if (!termo) return true;
      const loja = cat(t).lojas.find((l) => l.id === p.lojaId)?.nome ?? '';
      const categoria = cat(t).categorias.find((c) => c.id === p.categoriaId)?.nome ?? '';
      return `${p.nome} ${categoria} ${loja}`.toLowerCase().includes(termo);
    });
    lista = filtrar(t, lista, q.f);
    return mock(ordenar(lista, q.ord));
  },

  /** GET /v1/produtos/{id}?cep= — inclui disponibilidade, frete e retirada para o CEP */
  obter: (
    t: string,
    id: string,
  ): Promise<{ produto: Produto; loja: Loja; categoria: Categoria; relacionados: Produto[] } | null> => {
    const produto = visiveis(t).find((p) => p.id === id);
    if (!produto) return mock(null);
    const loja = cat(t).lojas.find((l) => l.id === produto.lojaId)!;
    const categoria = cat(t).categorias.find((c) => c.id === produto.categoriaId)!;
    const relacionados = [
      ...visiveis(t).filter((x) => x.lojaId === loja.id && x.id !== id),
      ...visiveis(t).filter((x) => x.categoriaId === produto.categoriaId && x.lojaId !== loja.id),
    ].slice(0, 8);
    return mock({ produto, loja, categoria, relacionados });
  },

  /** Usado pela sacola no cliente para montar as linhas (no back-end: GET /v1/sacola já devolve isso). */
  porIds: (t: string, ids: string[]): Promise<Produto[]> =>
    mock(visiveis(t).filter((p) => ids.includes(p.id))),
};

export const lojas = {
  /** GET /v1/lojas */
  listar: (t: string): Promise<Loja[]> => mock(cat(t).lojas),
  /** GET /v1/lojas/{id} */
  obter: (t: string, id: string): Promise<{ loja: Loja; produtos: Produto[] } | null> => {
    const loja = cat(t).lojas.find((l) => l.id === id);
    return mock(loja ? { loja, produtos: visiveis(t).filter((p) => p.lojaId === id) } : null);
  },
};

export const vagas = {
  /** GET /v1/anuncios/vagas */
  listar: (_t: string) => mock(VAGAS),
};
