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
import { disponibilidadeKit, precoMinimoKitAberto } from '@/lib/regras/kits';

const cat = (t: string) => CATALOGO[t] ?? { categorias: [], lojas: [], produtos: [] };

/**
 * Produtos à venda na cidade, com os kits resolvidos (PRD-05):
 * - kit fechado: disponibilidade = pior entre os componentes (não tem estoque próprio);
 * - kit aberto: preço "a partir de" = itens mais baratos no mínimo exigido, com desconto;
 *   indisponível se não houver opções suficientes.
 * No back-end isso é calculado no servidor a partir do estoque real.
 */
const visiveis = (t: string): Produto[] => {
  const base = cat(t).produtos.filter((p) => cat(t).lojas.some((l) => l.id === p.lojaId));
  const porId = new Map(base.map((p) => [p.id, p]));
  return base.map((p) => {
    if (!p.kit) return p;
    const comps = p.kit.componentes.map((c) => porId.get(c.produtoId)).filter((x): x is Produto => !!x);
    if (p.kit.tipo === 'fechado')
      return {
        ...p,
        disponibilidade: disponibilidadeKit([p.disponibilidade, ...comps.map((c) => c.disponibilidade)]),
      };
    const livres = comps.filter((c) => c.disponibilidade !== 'indisponivel').length;
    return {
      ...p,
      precoCentavos: precoMinimoKitAberto(p.kit, comps),
      disponibilidade: livres >= p.kit.minimoItens ? p.disponibilidade : 'indisponivel',
    };
  });
};

/** Filtros do painel lateral (CLAUDE.md §16). Preços em centavos. */
export interface FiltrosLaterais {
  sub?: string;
  marcas?: string[];
  lojas?: string[];
  caracteristicas?: string[];
  precoMin?: number;
  precoMax?: number;
}

export interface Facetas {
  marcas: Array<{ valor: string; total: number }>;
  lojas: Array<{ valor: string; rotulo: string; total: number }>;
  caracteristicas: Array<{ valor: string; total: number }>;
  preco: { min: number; max: number };
}

function aplicarLaterais(lista: Produto[], f: FiltrosLaterais = {}): Produto[] {
  return lista.filter(
    (p) =>
      (!f.sub || p.subcategoriaId === f.sub) &&
      (!f.marcas?.length || (p.marca !== null && f.marcas.includes(p.marca))) &&
      (!f.lojas?.length || f.lojas.includes(p.lojaId)) &&
      (!f.caracteristicas?.length || f.caracteristicas.every((c) => p.caracteristicas.includes(c))) &&
      (f.precoMin === undefined || p.precoCentavos >= f.precoMin) &&
      (f.precoMax === undefined || p.precoCentavos <= f.precoMax),
  );
}

function contar(valores: string[]) {
  const m = new Map<string, number>();
  valores.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()]
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => a.valor.localeCompare(b.valor, 'pt-BR'));
}

/** Opções do painel de filtros, calculadas sobre a lista antes dos filtros laterais. */
function facetas(t: string, lista: Produto[]): Facetas {
  const precos = lista.map((p) => p.precoCentavos);
  return {
    marcas: contar(lista.flatMap((p) => (p.marca ? [p.marca] : []))),
    lojas: contar(lista.map((p) => p.lojaId)).map((x) => ({
      ...x,
      rotulo: cat(t).lojas.find((l) => l.id === x.valor)?.nome ?? x.valor,
    })),
    caracteristicas: contar(lista.flatMap((p) => p.caracteristicas)),
    preco: { min: precos.length ? Math.min(...precos) : 0, max: precos.length ? Math.max(...precos) : 0 },
  };
}

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
  facetas: Facetas;
  subcategoriasComProdutos: Categoria['subcategorias'];
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
    q: { ord?: Ordem; f?: Filtro; cep?: string; laterais?: FiltrosLaterais } = {},
  ): Promise<VitrineCategoria | null> => {
    const categoria = cat(t).categorias.find((c) => c.id === id);
    if (!categoria) return mock(null);
    const todos = visiveis(t).filter((p) => p.categoriaId === id);
    const daSub = aplicarLaterais(todos, { sub: q.laterais?.sub });
    return mock({
      categoria,
      produtos: ordenar(filtrar(t, aplicarLaterais(todos, q.laterais), q.f), q.ord),
      facetas: facetas(t, daSub),
      subcategoriasComProdutos: categoria.subcategorias.filter((s) =>
        todos.some((p) => p.subcategoriaId === s.id),
      ),
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
    q: {
      q?: string;
      cat?: string;
      ord?: Ordem;
      f?: Filtro;
      soOfertas?: boolean;
      laterais?: FiltrosLaterais;
    } = {},
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
    lista = filtrar(t, aplicarLaterais(lista, q.laterais), q.f);
    return mock(ordenar(lista, q.ord));
  },

  /** Mesma busca, devolvendo também as opções do painel de filtros. */
  pesquisar: async (
    t: string,
    q: { q?: string; ord?: Ordem; f?: Filtro; soOfertas?: boolean; laterais?: FiltrosLaterais } = {},
  ): Promise<{ itens: Produto[]; facetas: Facetas }> => {
    const semLaterais = await produtos.buscar(t, { ...q, laterais: undefined, f: undefined });
    return { itens: await produtos.buscar(t, q), facetas: facetas(t, semLaterais) };
  },

  /** GET /v1/produtos/{id}?cep= — inclui disponibilidade, frete e retirada para o CEP */
  obter: (
    t: string,
    id: string,
  ): Promise<{
    produto: Produto;
    loja: Loja;
    categoria: Categoria;
    relacionados: Produto[];
    componentes: Produto[]; // kits: produtos que compõem ou que podem ser escolhidos
  } | null> => {
    const produto = visiveis(t).find((p) => p.id === id);
    if (!produto) return mock(null);
    const loja = cat(t).lojas.find((l) => l.id === produto.lojaId)!;
    const categoria = cat(t).categorias.find((c) => c.id === produto.categoriaId)!;
    const relacionados = [
      ...visiveis(t).filter((x) => x.lojaId === loja.id && x.id !== id),
      ...visiveis(t).filter((x) => x.categoriaId === produto.categoriaId && x.lojaId !== loja.id),
    ].slice(0, 8);
    const componentes = (produto.kit?.componentes ?? [])
      .map((c) => visiveis(t).find((x) => x.id === c.produtoId))
      .filter((x): x is Produto => !!x);
    return mock({ produto, loja, categoria, relacionados, componentes });
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
