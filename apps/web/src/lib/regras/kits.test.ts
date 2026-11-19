import { describe, expect, it } from 'vitest';
import { lerLaterais, totalAtivos, urlFiltros } from '@/lib/filtros';
import type { Kit } from '@/types/domain';
import {
  demandaPorProduto,
  disponibilidadeKit,
  escolhaValida,
  kitValido,
  precoKitAberto,
  precoMinimoKitAberto,
} from './kits';

const fechado: Kit = {
  tipo: 'fechado',
  componentes: [
    { produtoId: 'a', quantidade: 2 },
    { produtoId: 'b', quantidade: 1 },
  ],
  minimoItens: 2,
  maximoItens: 2,
  descontoPercentual: 0,
};
const aberto: Kit = {
  tipo: 'aberto',
  componentes: ['a', 'b', 'c', 'd'].map((produtoId) => ({ produtoId, quantidade: 1 })),
  minimoItens: 2,
  maximoItens: 3,
  descontoPercentual: 10,
};
const daLoja = (...ids: string[]) => ids.map((id) => ({ id, lojaId: 'L1' }));

describe('kits (PRD-05)', () => {
  it('precisa de pelo menos 2 produtos distintos da mesma loja', () => {
    expect(kitValido(fechado, 'L1', daLoja('a', 'b'))).toBe(true);
    const repetido: Kit = { ...fechado, componentes: [{ produtoId: 'a', quantidade: 3 }] };
    expect(kitValido(repetido, 'L1', daLoja('a'))).toBe(false);
    expect(
      kitValido(fechado, 'L1', [
        { id: 'a', lojaId: 'L1' },
        { id: 'b', lojaId: 'OUTRA' },
      ]),
    ).toBe(false);
  });

  it('kit fechado fica com a pior disponibilidade entre os componentes', () => {
    expect(disponibilidadeKit(['disponivel', 'disponivel'])).toBe('disponivel');
    expect(disponibilidadeKit(['disponivel', 'ultimas_unidades'])).toBe('ultimas_unidades');
    expect(disponibilidadeKit(['ultimas_unidades', 'indisponivel'])).toBe('indisponivel');
  });

  it('kit aberto: soma dos escolhidos com desconto, arredondada no fim [PROPOSTA]', () => {
    expect(
      precoKitAberto(
        [
          { precoCentavos: 7990, quantidade: 1 },
          { precoCentavos: 5990, quantidade: 1 },
        ],
        10,
      ),
    ).toBe(12582);
  });

  it('"a partir de" usa os itens mais baratos disponíveis', () => {
    const opcoes = [
      { id: 'a', precoCentavos: 7990, disponibilidade: 'disponivel' as const },
      { id: 'b', precoCentavos: 5990, disponibilidade: 'ultimas_unidades' as const },
      { id: 'c', precoCentavos: 3490, disponibilidade: 'disponivel' as const },
      { id: 'd', precoCentavos: 990, disponibilidade: 'indisponivel' as const }, // não entra
    ];
    expect(precoMinimoKitAberto(aberto, opcoes)).toBe(Math.round((3490 + 5990) * 0.9));
  });

  it('escolha respeita mínimo, máximo, itens do kit e não repete', () => {
    expect(escolhaValida(aberto, ['a'])).toBe(false);
    expect(escolhaValida(aberto, ['a', 'b'])).toBe(true);
    expect(escolhaValida(aberto, ['a', 'b', 'c', 'd'])).toBe(false);
    expect(escolhaValida(aberto, ['a', 'x'])).toBe(false);
    expect(escolhaValida(aberto, ['a', 'a'])).toBe(false);
  });

  it('demanda de kits e de itens avulsos é somada por produto', () => {
    const d = demandaPorProduto(
      [
        { chave: '1', produtoId: 'K', opcao: null, quantidade: 2 }, // kit fechado: 2×(2a + 1b)
        { chave: '2', produtoId: 'a', opcao: null, quantidade: 1 }, // avulso
        {
          chave: '3',
          produtoId: 'KA',
          opcao: null,
          quantidade: 1,
          composicao: [
            { produtoId: 'b', quantidade: 1 },
            { produtoId: 'c', quantidade: 1 },
          ],
        },
      ],
      { K: fechado, KA: aberto },
    );
    expect(d).toEqual({ a: 5, b: 3, c: 1 });
  });
});

describe('filtros laterais na URL', () => {
  it('lê e ignora valores inválidos', () => {
    const f = lerLaterais({
      marca: 'Vale Azul,Linho Cru',
      loja: 'vale-azul',
      car: '',
      min: '50',
      max: 'abc',
      sub: 'camisaria',
    });
    expect(f).toEqual({
      sub: 'camisaria',
      marcas: ['Vale Azul', 'Linho Cru'],
      lojas: ['vale-azul'],
      caracteristicas: [],
      precoMin: 5000,
      precoMax: undefined,
    });
    expect(totalAtivos(f)).toBe(4);
  });
  it('monta a URL sem parâmetros vazios', () => {
    expect(urlFiltros('/c/moda', { ord: 'menor', marcas: ['Vale Azul'], precoMax: 20000, lojas: [] })).toBe(
      '/c/moda?ord=menor&marca=Vale+Azul&max=200',
    );
    expect(urlFiltros('/c/moda', {})).toBe('/c/moda');
  });
});
