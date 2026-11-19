import { describe, expect, it } from 'vitest';
import { INCREMENTO_LANCE, diasEquivalentes, lanceMinimo, limitarQuantidade, valorTabela } from './anuncios';

const vaga = { precoDiaCentavos: 6000 }; // H1: R$ 60/dia

describe('valor de tabela do anúncio (CLAUDE.md §9.2) [PROPOSTA]', () => {
  it('hora = 8% da diária', () => {
    expect(valorTabela(vaga, 'horas', 6)).toBe(2880); // 6 × 4,80
  });
  it('dia = diária × dias', () => {
    expect(valorTabela(vaga, 'dias', 7)).toBe(42000);
  });
  it('semana = 7 × diária', () => {
    expect(valorTabela(vaga, 'semanas', 2)).toBe(84000);
  });
  it('mês = 30 × diária (teto de uma contratação)', () => {
    expect(valorTabela(vaga, 'mes', 1)).toBe(180000);
  });
  it('mais tempo nunca custa menos', () => {
    expect(valorTabela(vaga, 'dias', 30)).toBeGreaterThan(valorTabela(vaga, 'semanas', 4));
    expect(valorTabela(vaga, 'semanas', 4)).toBeGreaterThan(valorTabela(vaga, 'dias', 27));
  });
});

describe('limites de tempo', () => {
  it('mínimo 6 h e máximo 72 h', () => {
    expect(limitarQuantidade('horas', 1)).toBe(6);
    expect(limitarQuantidade('horas', 100)).toBe(72);
  });
  it('máximo 30 dias ou 4 semanas por contratação', () => {
    expect(limitarQuantidade('dias', 45)).toBe(30);
    expect(limitarQuantidade('semanas', 7)).toBe(4);
    expect(limitarQuantidade('mes', 3)).toBe(1);
  });
  it('quantidade é inteira', () => {
    expect(limitarQuantidade('dias', 2.6)).toBe(3);
  });
  it('converte o período em dias', () => {
    expect(diasEquivalentes('horas', 12)).toBeCloseTo(0.5);
    expect(diasEquivalentes('semanas', 2)).toBe(14);
  });
});

describe('lance mínimo (CLAUDE.md §9.3)', () => {
  it('vaga em disputa: lance atual + R$ 2', () => {
    expect(lanceMinimo({ status: 'leilao', lanceAtualCentavos: 9200, precoDiaCentavos: 6000 })).toBe(
      9200 + INCREMENTO_LANCE,
    );
  });
  it('vaga livre ou ocupada: valor de tabela por dia', () => {
    expect(lanceMinimo({ status: 'disponivel', lanceAtualCentavos: null, precoDiaCentavos: 3500 })).toBe(
      3500,
    );
    expect(lanceMinimo({ status: 'ocupado', lanceAtualCentavos: null, precoDiaCentavos: 2200 })).toBe(2200);
  });
});
