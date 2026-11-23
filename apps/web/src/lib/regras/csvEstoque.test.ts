import { describe, expect, it } from 'vitest';
import { lerCsvEstoque } from './csvEstoque';

describe('importação de estoque CSV', () => {
  it('lê delimitadores, BOM e campos entre aspas', () => {
    expect(lerCsvEstoque('\uFEFFsku;quantidade;produto\r\n"ABC-1";12;"Produto; especial"')).toEqual([
      { sku: 'ABC-1', quantidade: 12 },
    ]);
    expect(lerCsvEstoque('sku,quantidade\nABC,0')).toEqual([{ sku: 'ABC', quantidade: 0 }]);
  });
  it('recusa valores inválidos, SKU repetido e cabeçalho ausente', () => {
    expect(() => lerCsvEstoque('sku;quantidade\nABC;-1')).toThrow();
    expect(() => lerCsvEstoque('sku;quantidade\nABC;2\nabc;3')).toThrow(/repetido/);
    expect(() => lerCsvEstoque('produto;saldo\nABC;3')).toThrow(/colunas/);
  });
});
