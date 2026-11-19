import { describe, expect, it } from 'vitest';
import { cadastroCompleto, motivoValido, podeSerOficial, repasse, situacaoIndicada } from './admin';

describe('administração', () => {
  it('motivo precisa de 10 caracteres', () => {
    expect(motivoValido('curto')).toBe(false);
    expect(motivoValido('   Foto com marca d’água   ')).toBe(true);
  });

  it('comissão só sobre produtos; frete é da loja; taxa uma vez sobre o cobrado', () => {
    expect(repasse({ produtosCentavos: 10000, freteCentavos: 850 }, 10, 2)).toEqual({
      comissao: 1000,
      taxa: 217,
      liquido: 9633,
    });
    expect(repasse({ produtosCentavos: 10000, freteCentavos: 0 }, 0, 0).liquido).toBe(10000);
  });

  it('Loja oficial exige os três documentos', () => {
    expect(podeSerOficial({ cartaoCnpj: true, contratoSocial: true, registroMarca: false })).toBe(false);
    expect(podeSerOficial({ cartaoCnpj: true, contratoSocial: true, registroMarca: true })).toBe(true);
  });

  it('Indicada: 100 pedidos num dia para ganhar, média de 100 para manter', () => {
    expect(situacaoIndicada({ maiorDia: 120, mediaDiaria6m: 40, indicada: false })).toBe('conquista');
    expect(situacaoIndicada({ maiorDia: 99, mediaDiaria6m: 40, indicada: false })).toBe('nao_elegivel');
    expect(situacaoIndicada({ maiorDia: 300, mediaDiaria6m: 100, indicada: true })).toBe('mantem');
    expect(situacaoIndicada({ maiorDia: 300, mediaDiaria6m: 80, indicada: true })).toBe('perde_na_revisao');
  });

  it('cadastro precisa de cartão CNPJ e contrato aceito', () => {
    expect(cadastroCompleto({ cartaoCnpj: true, contratoAceito: false })).toBe(false);
    expect(cadastroCompleto({ cartaoCnpj: true, contratoAceito: true })).toBe(true);
  });
});
