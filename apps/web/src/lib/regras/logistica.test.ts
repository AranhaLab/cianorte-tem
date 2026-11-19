import { describe, expect, it } from 'vitest';
import { distanciaDemoKm, errosLogistica, previsao, simularTrajeto, type LogisticaLoja } from './logistica';

const l = (x: Partial<LogisticaLoja> = {}): LogisticaLoja => ({
  entrega: true,
  tarifaKmCentavos: 250,
  distanciaMaxKm: 10,
  freteGratisAPartirDe: null,
  corte: '15:00',
  retirada: true,
  ...x,
});
const tenant = { cepsAtendidos: ['87200', '87209'] };
// 17h UTC = 14h em São Paulo
const antesDoCorte = new Date('2026-11-19T17:00:00Z');
const depoisDoCorte = new Date('2026-11-19T19:30:00Z');

describe('logística da loja', () => {
  it('valida a configuração', () => {
    expect(errosLogistica(l())).toEqual({});
    expect(errosLogistica(l({ entrega: false, retirada: false })).modos).toBeDefined();
    expect(errosLogistica(l({ distanciaMaxKm: 80 })).distancia).toBeDefined();
    expect(errosLogistica(l({ tarifaKmCentavos: 0 })).tarifa).toBeDefined();
    expect(errosLogistica(l({ corte: '25:00' })).corte).toBeDefined();
    // Sem entrega, tarifa e distância não importam
    expect(errosLogistica(l({ entrega: false, tarifaKmCentavos: 0 }))).toEqual({});
  });

  it('previsão segue o horário de corte em São Paulo', () => {
    expect(previsao('15:00', antesDoCorte)).toBe('hoje');
    expect(previsao('15:00', depoisDoCorte)).toBe('amanha');
  });

  it('distância de demonstração é estável e entre 1 e 15 km', () => {
    const d = distanciaDemoKm('87200-000');
    expect(d).toBe(distanciaDemoKm('87200000'));
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(15.1);
  });

  it('trajeto de teste: frete com mínimo, raio e cidade', () => {
    expect(simularTrajeto(l(), tenant, '87200000', antesDoCorte, 3.4)).toEqual({
      atendido: true,
      distanciaKm: 3.4,
      freteCentavos: 850,
      gratisAcima: null,
      previsao: 'hoje',
    });
    expect(simularTrajeto(l(), tenant, '87200000', antesDoCorte, 1)).toMatchObject({ freteCentavos: 600 });
    expect(simularTrajeto(l(), tenant, '87200000', antesDoCorte, 12)).toMatchObject({
      atendido: false,
      motivo: 'distancia',
    });
    expect(simularTrajeto(l(), tenant, '86000000')).toMatchObject({ motivo: 'fora_da_cidade' });
    expect(simularTrajeto(l(), tenant, '872')).toMatchObject({ motivo: 'cep_invalido' });
    expect(simularTrajeto(l({ entrega: false }), tenant, '87200000')).toMatchObject({
      motivo: 'sem_entrega',
    });
  });
});
