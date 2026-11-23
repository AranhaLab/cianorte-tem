import { desconto } from '@/lib/regras/dinheiro';
import { disponibilidadePublica } from '@/lib/regras/disponibilidade';
import { agruparAtributos, possuiAtributos } from '@/lib/regras/atributos';
import type { Facetas, Filtro, FiltrosLaterais, Ordem } from '@/lib/api';
import type { EdicaoProduto } from '@/stores/painel';
import type { EstoqueItem, Loja, Produto } from '@/types/domain';

export function produtoDaEdicao(
  id: string,
  lojaId: string,
  edicao: EdicaoProduto,
  estoque: EstoqueItem[],
  reserva: number,
  anterior?: Produto,
): Produto {
  const r = edicao.atual;
  const item = estoque.find((e) => e.produtoId === id);
  return {
    id,
    lojaId,
    nome: r.nome,
    categoriaId: r.categoriaId,
    subcategoriaId: r.subcategoriaId,
    precoCentavos: r.precoCentavos,
    precoDeCentavos: r.precoDeCentavos,
    disponibilidade: item
      ? item.indisponivelManual
        ? 'indisponivel'
        : disponibilidadePublica({ saldo: item.saldo, minimo: item.minimo, reservaSeguranca: reserva })
      : (anterior?.disponibilidade ?? 'indisponivel'),
    variacao: r.variacao ? { nome: r.variacao.nome, opcoes: r.variacao.opcoes.map((o) => o.nome) } : null,
    kit: r.kit,
    digital:
      anterior?.digital ??
      (r.digital
        ? {
            formato: r.digital.formato,
            tamanhoBytes: r.digital.tamanhoBytes,
            limiteDownloads: 5,
            validadeDias: 30,
          }
        : null),
    marca: r.marca || null,
    caracteristicas: r.caracteristicas,
    atributos: r.atributos ?? [],
    midias: r.midias,
    vendidos: anterior?.vendidos ?? 0,
    emAlta: anterior?.emAlta ?? 0,
  };
}

export function mesclarProdutos(
  base: Produto[],
  edicoes: Record<string, EdicaoProduto>,
  lojaId: string,
  estoque: EstoqueItem[],
  reserva: number,
  lojaPublicada: boolean,
): Produto[] {
  const vistos = new Set(base.map((p) => p.id));
  const existentes = base.map((p) =>
    p.lojaId === lojaId && edicoes[p.id]
      ? produtoDaEdicao(p.id, lojaId, edicoes[p.id]!, estoque, reserva, p)
      : p,
  );
  const novos = lojaPublicada
    ? Object.entries(edicoes)
        .filter(([id, e]) => id.startsWith('novo-') && !vistos.has(id) && !e.novo)
        .map(([id, e]) => produtoDaEdicao(id, lojaId, e, estoque, reserva))
    : [];
  return [...existentes, ...novos];
}

export function filtrarProdutos(
  lista: Produto[],
  lojas: Loja[],
  f: FiltrosLaterais = {},
  rapido?: Filtro,
  ordem: Ordem = 'vendidos',
): Produto[] {
  const filtrados = lista.filter((p) => {
    const loja = lojas.find((l) => l.id === p.lojaId);
    return (
      (!f.sub || p.subcategoriaId === f.sub) &&
      (!f.marcas?.length || (!!p.marca && f.marcas.includes(p.marca))) &&
      (!f.lojas?.length || f.lojas.includes(p.lojaId)) &&
      (!f.caracteristicas?.length || f.caracteristicas.every((c) => p.caracteristicas.includes(c))) &&
      possuiAtributos(p, f.atributos) &&
      (f.precoMin === undefined || p.precoCentavos >= f.precoMin) &&
      (f.precoMax === undefined || p.precoCentavos <= f.precoMax) &&
      (!rapido ||
        (rapido === 'hoje'
          ? /Hoje|Em 2/.test(loja?.prazo ?? '')
          : rapido === 'retirada'
            ? !!loja?.retirada
            : loja?.selo === 'oficial'))
    );
  });
  return filtrados.sort((a, b) =>
    ordem === 'menor'
      ? a.precoCentavos - b.precoCentavos
      : ordem === 'desconto'
        ? desconto(b) - desconto(a)
        : b.vendidos - a.vendidos,
  );
}

export function facetasDaLista(lista: Produto[], lojas: Loja[]): Facetas {
  const contar = (v: string[]) => {
    const m = new Map<string, number>();
    v.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
    return [...m]
      .map(([valor, total]) => ({ valor, total }))
      .sort((a, b) => a.valor.localeCompare(b.valor, 'pt-BR'));
  };
  const precos = lista.map((p) => p.precoCentavos);
  return {
    marcas: contar(lista.flatMap((p) => (p.marca ? [p.marca] : []))),
    lojas: contar(lista.map((p) => p.lojaId)).map((x) => ({
      ...x,
      rotulo: lojas.find((l) => l.id === x.valor)?.nome ?? x.valor,
    })),
    caracteristicas: contar(lista.flatMap((p) => p.caracteristicas)),
    atributos: agruparAtributos(lista),
    preco: { min: precos.length ? Math.min(...precos) : 0, max: precos.length ? Math.max(...precos) : 0 },
  };
}
