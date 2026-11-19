import { describe, expect, it } from 'vitest';
import { ROTULO_DISPONIBILIDADE, disponibilidadePublica } from './disponibilidade';

describe('disponibilidade pública (CLAUDE.md §5.3 e §8)', () => {
  const d = (saldo: number, reservaSeguranca: number, minimo: number, reservadoPedidos = 0) =>
    disponibilidadePublica({ saldo, reservaSeguranca, minimo, reservadoPedidos });

  it('desconta a reserva de segurança do balcão', () => {
    expect(d(42, 2, 10)).toBe('disponivel');
    expect(d(42, 40, 10)).toBe('ultimas_unidades'); // sobram 2
    expect(d(42, 42, 10)).toBe('indisponivel');
  });
  it('desconta também o que está reservado por pedidos em aberto', () => {
    expect(d(20, 2, 5, 13)).toBe('ultimas_unidades'); // 20 − 2 − 13 = 5
    expect(d(20, 2, 5, 18)).toBe('indisponivel');
  });
  it('"Últimas unidades" quando o livre chega ao estoque mínimo [PROPOSTA]', () => {
    expect(d(8, 0, 8)).toBe('ultimas_unidades');
    expect(d(9, 0, 8)).toBe('disponivel');
  });
  it('saldo zerado ou negativo nunca aparece como disponível', () => {
    expect(d(0, 0, 5)).toBe('indisponivel');
    expect(d(-3, 0, 5)).toBe('indisponivel');
  });
  it('o comprador só vê rótulos, nunca números', () => {
    for (const r of Object.values(ROTULO_DISPONIBILIDADE)) expect(r).not.toMatch(/\d/);
  });
});
