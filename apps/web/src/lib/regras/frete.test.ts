import { describe, expect, it } from 'vitest';
import {
  FRETE_MINIMO,
  cepAtendido,
  freteBase,
  freteFinal,
  podeRetirar,
  prefixoCep,
  progressoFreteGratis,
} from './frete';

const tenant = { cepsAtendidos: ['87200', '87201'] };
const loja = (tarifaKmCentavos: number, freteGratisAPartirDe: number | null = null) => ({
  tarifaKmCentavos,
  freteGratisAPartirDe,
});

describe('cobertura por CEP (CLAUDE.md §5.2)', () => {
  it('usa o prefixo de 5 dígitos, com ou sem hífen', () => {
    expect(prefixoCep('87200-100')).toBe('87200');
    expect(prefixoCep('87201999')).toBe('87201');
  });
  it('atende só os CEPs da cidade', () => {
    expect(cepAtendido(tenant, '87200-000')).toBe(true);
    expect(cepAtendido(tenant, '86000-000')).toBe(false);
    expect(cepAtendido(tenant, '')).toBe(false);
  });
});

describe('frete por loja', () => {
  it('é distância × tarifa por km, sem arredondar antes do cálculo', () => {
    // 190 centavos/km × 3,4 km = 646 centavos
    expect(freteBase(loja(190))).toBe(646);
    expect(freteBase(loja(300), 2.5)).toBe(750); // R$ 3/km × 2,5 km
  });
  it('respeita o frete mínimo de R$ 6', () => {
    expect(freteBase(loja(120))).toBe(FRETE_MINIMO); // 1,20 × 3,4 = 4,08 → 6,00
  });
  it('zera quando o subtotal DA LOJA atinge o frete grátis dela', () => {
    const l = loja(190, 19900);
    expect(freteFinal(l, 19899)).toBe(646);
    expect(freteFinal(l, 19900)).toBe(0);
  });
  it('loja sem frete grátis cobra sempre', () => {
    expect(freteFinal(loja(250), 1_000_000)).toBe(850);
  });
});

describe('barra "Faltam R$ X para frete grátis"', () => {
  it('mostra quanto falta e o percentual', () => {
    expect(progressoFreteGratis(loja(190, 19900), 17980)).toEqual({ falta: 1920, pct: 90, atingido: false });
  });
  it('não passa de 100% nem fica negativa', () => {
    expect(progressoFreteGratis(loja(190, 19900), 30000)).toEqual({ falta: 0, pct: 100, atingido: true });
  });
  it('não existe para loja sem frete grátis', () => {
    expect(progressoFreteGratis(loja(190), 5000)).toBeNull();
  });
});

describe('retirada (CLAUDE.md §5.2)', () => {
  it('só quando a loja oferece e o comprador é da mesma cidade', () => {
    expect(podeRetirar({ retirada: true }, true)).toBe(true);
    expect(podeRetirar({ retirada: true }, false)).toBe(false);
    expect(podeRetirar({ retirada: false }, true)).toBe(false);
  });
});
