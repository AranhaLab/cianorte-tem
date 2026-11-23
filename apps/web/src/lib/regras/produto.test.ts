import { describe, expect, it } from 'vitest';
import {
  aplicarAprovacao,
  aplicarEdicao,
  classificarMidia,
  errosProduto,
  formatoDigital,
  gtinValido,
  mover,
  type RascunhoProduto,
} from './produto';

const base = (x: Partial<RascunhoProduto> = {}): RascunhoProduto => ({
  id: 'p1',
  nome: 'Camisa social',
  descricao: '',
  categoriaId: 'moda',
  subcategoriaId: null,
  marca: '',
  caracteristicas: [],
  tipo: 'simples',
  precoCentavos: 8990,
  precoDeCentavos: null,
  sku: 'VA-1',
  gtin: '',
  saldo: 10,
  minimo: 2,
  variacao: null,
  kit: null,
  digital: null,
  midias: [{ id: 'f1', tipo: 'imagem', legenda: 'Foto', variante: 0 }],
  ...x,
});
const ctx = {
  lojaId: 'va',
  produtosDaLoja: [
    { id: 'a', lojaId: 'va' },
    { id: 'b', lojaId: 'va' },
    { id: 'x', lojaId: 'outra' },
  ],
  skusDaLoja: ['VA-2'],
};

describe('GTIN/EAN', () => {
  it('confere o dígito verificador', () => {
    expect(gtinValido('4006381333931')).toBe(true);
    expect(gtinValido('73513537')).toBe(true);
    expect(gtinValido('4006381333932')).toBe(false);
    expect(gtinValido('123')).toBe(false);
  });
});

describe('errosProduto', () => {
  it('aceita um produto simples completo', () => {
    expect(errosProduto(base(), ctx)).toEqual({});
  });

  it('valida categoria ativa e vínculo da subcategoria quando a lista é fornecida', () => {
    const categorias = [
      {
        id: 'moda',
        nome: 'Moda',
        icone: 'shirt' as const,
        tom: 'rgb(0, 0, 0)',
        destaque: '',
        proporcaoMidia: '4:5' as const,
        subcategorias: [{ id: 'camisas', nome: 'Camisas' }],
      },
    ];
    expect(errosProduto(base({ categoriaId: 'removida' }), { ...ctx, categorias }).categoriaId).toBeDefined();
    expect(
      errosProduto(base({ subcategoriaId: 'outra' }), { ...ctx, categorias }).subcategoriaId,
    ).toBeDefined();
    expect(errosProduto(base({ subcategoriaId: 'camisas' }), { ...ctx, categorias })).toEqual({});
  });

  it('SKU é único por loja', () => {
    expect(errosProduto(base({ sku: 'va-2' }), ctx).sku).toMatch(/já é usado/);
  });

  it('preço "de" precisa ser maior que o preço', () => {
    expect(errosProduto(base({ precoDeCentavos: 8990 }), ctx).precoDeCentavos).toBeDefined();
  });

  it('exige foto e texto alternativo', () => {
    expect(errosProduto(base({ midias: [] }), ctx).midias).toMatch(/pelo menos uma foto/);
    expect(
      errosProduto(base({ midias: [{ id: 'v', tipo: 'video', legenda: 'v', variante: 0 }] }), ctx).midias,
    ).toMatch(/além do vídeo/);
    expect(
      errosProduto(base({ midias: [{ id: 'f', tipo: 'imagem', legenda: ' ', variante: 0 }] }), ctx).midias,
    ).toMatch(/Descreva/);
  });

  it('variações: 2+ opções distintas e SKU próprio por opção', () => {
    const v = (opcoes: Array<[string, string]>) =>
      base({
        tipo: 'variacoes',
        variacao: { nome: 'Tamanho', opcoes: opcoes.map(([nome, sku]) => ({ nome, sku, saldo: 1 })) },
      });
    expect(errosProduto(v([['P', 'S-P']]), ctx).variacao).toMatch(/2 opções/);
    expect(
      errosProduto(
        v([
          ['P', 'S-P'],
          ['p', 'S-P2'],
        ]),
        ctx,
      ).variacao,
    ).toMatch(/diferentes/);
    expect(
      errosProduto(
        v([
          ['P', 'S-P'],
          ['M', 'S-P'],
        ]),
        ctx,
      )['opcao-1'],
    ).toMatch(/já é usado/);
    expect(
      errosProduto(
        v([
          ['P', 'S-P'],
          ['M', 'S-M'],
        ]),
        ctx,
      ),
    ).toEqual({});
  });

  it('kit: 2+ produtos da própria loja', () => {
    const kit = (ids: string[]) =>
      base({
        tipo: 'kit',
        kit: {
          tipo: 'fechado',
          componentes: ids.map((produtoId) => ({ produtoId, quantidade: 1 })),
          minimoItens: 2,
          maximoItens: 2,
          descontoPercentual: 0,
        },
      });
    expect(errosProduto(kit(['a']), ctx).kit).toBeDefined();
    expect(errosProduto(kit(['a', 'x']), ctx).kit).toBeDefined();
    expect(errosProduto(kit(['a', 'b']), ctx)).toEqual({});
  });

  it('digital exige o arquivo', () => {
    expect(errosProduto(base({ tipo: 'digital' }), ctx).digital).toBeDefined();
  });
});

describe('moderação (§7.3)', () => {
  it('preço e estoque valem na hora; nome vai para análise', () => {
    const r = aplicarEdicao(base(), base({ precoCentavos: 7990, saldo: 4, nome: 'Camisa slim' }));
    expect(r.imediatas).toEqual(['precoCentavos', 'saldo']);
    expect(r.editoriais).toEqual(['nome']);
    expect(r.atual.precoCentavos).toBe(7990);
    expect(r.atual.nome).toBe('Camisa social');
    expect(r.emAnalise?.nome).toBe('Camisa slim');
  });

  it('só preço: nada vai para análise', () => {
    expect(aplicarEdicao(base(), base({ precoCentavos: 100 })).emAnalise).toBeNull();
  });

  it('saldo de opção é estoque, não conteúdo', () => {
    const v = (saldo: number) =>
      base({ tipo: 'variacoes', variacao: { nome: 'T', opcoes: [{ nome: 'P', sku: 'A', saldo }] } });
    const r = aplicarEdicao(v(1), v(9));
    expect(r.editoriais).toEqual([]);
    expect(r.imediatas).toEqual(['saldo']);
    expect(r.atual.variacao?.opcoes[0]?.saldo).toBe(9);
  });

  it('aprovar o conteúdo não restaura preço antigo', () => {
    const emAnalise = base({ nome: 'Novo nome', precoCentavos: 8990 });
    const atual = base({ precoCentavos: 6990 });
    const r = aplicarAprovacao(atual, emAnalise);
    expect(r.nome).toBe('Novo nome');
    expect(r.precoCentavos).toBe(6990);
  });
});

describe('arquivos', () => {
  it('classifica fotos e vídeos', () => {
    expect(classificarMidia({ type: 'image/webp', size: 1 })).toEqual({ tipo: 'imagem' });
    expect(classificarMidia({ type: 'video/mp4', size: 1 })).toEqual({ tipo: 'video' });
    expect(classificarMidia({ type: 'image/jpeg', size: 10_000_001 })).toHaveProperty('erro');
    expect(classificarMidia({ type: 'image/gif', size: 1 })).toHaveProperty('erro');
  });

  it('arquivo digital: PDF, EPUB ou ZIP', () => {
    expect(formatoDigital({ name: 'molde.zip', size: 10 })).toBe('ZIP');
    expect(formatoDigital({ name: 'livro.docx', size: 10 })).toHaveProperty('erro');
  });

  it('move itens da galeria', () => {
    expect(mover([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(mover([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});
