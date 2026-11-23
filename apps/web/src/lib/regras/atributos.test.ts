import { describe, expect, it } from 'vitest';
import type { Produto } from '@/types/domain';
import { agruparAtributos, chaveAtributo, possuiAtributos } from './atributos';
import { lerLaterais, urlFiltros } from '@/lib/filtros';

const p = (id: string, atributos: Produto['atributos'], variacao: Produto['variacao'] = null) =>
  ({ id, atributos, variacao }) as Produto;

describe('filtros de atributos e variações', () => {
  it('agrupa atributos equivalentes e conta produtos, inclusive variações sem duplicar', () => {
    const grupos = agruparAtributos([
      p('1', [{ nome: 'Cor', valor: 'Azul' }], { nome: 'COR', opcoes: ['Azul', 'Vermelho'] }),
      p('2', [{ nome: 'cor', valor: 'azul' }]),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.opcoes.find((o) => o.rotulo === 'Azul')?.total).toBe(2);
  });
  it('combina opções do mesmo atributo com OU e atributos diferentes com E', () => {
    const produto = p('1', [
      { nome: 'Cor', valor: 'Azul' },
      { nome: 'Material', valor: 'Algodão' },
    ]);
    expect(
      possuiAtributos(produto, [
        chaveAtributo('Cor', 'azul'),
        chaveAtributo('Cor', 'vermelho'),
        chaveAtributo('Material', 'algodao'),
      ]),
    ).toBe(true);
    expect(possuiAtributos(produto, [chaveAtributo('Cor', 'azul'), chaveAtributo('Material', 'linho')])).toBe(
      false,
    );
  });
  it('mantém atributos com vírgulas na URL e ignora dados inválidos', () => {
    const selecionado = chaveAtributo('Material', 'Lã, algodão');
    const url = urlFiltros('/c/moda', { atributos: [selecionado] });
    const params = new URL(url, 'https://example.test').searchParams;
    expect(lerLaterais({ at: params.getAll('at') }).atributos).toEqual([selecionado]);
    expect(lerLaterais({ at: 'inválido' }).atributos).toEqual([]);
  });
});
