import { describe, expect, it } from 'vitest';
import {
  cadastroVazio,
  cnpjValido,
  erroDocumento,
  errosEtapa,
  etapaPendente,
  mascaraCelular,
  mascaraCep,
  mascaraCnpj,
  mascaraCpf,
} from './cadastroLoja';

const completo = () => {
  const c = cadastroVazio();
  c.empresa = { cnpj: '11.222.333/0001-81', razao: 'Confecções Exemplo Ltda', fantasia: 'Exemplo', ie: '' };
  c.responsavel = {
    nome: 'Pessoa Teste',
    cpf: '529.982.247-25',
    email: 'loja@exemplo.com',
    celular: '(44) 99999-0000',
  };
  c.unidade = { cep: '87200-000', rua: 'Av. América', numero: '100', bairro: 'Zona 1', horario: 'Seg a sáb' };
  c.recebimento = { conectado: true, conta: 'Banco ••• 1234' };
  c.documentos = { cartaoCnpj: { nome: 'cartao.pdf', tamanhoBytes: 1000 } };
  c.aceite = true;
  return c;
};

describe('cadastro da loja', () => {
  it('CNPJ confere os dígitos', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11.222.333/0001-82')).toBe(false);
    expect(cnpjValido('11111111111111')).toBe(false);
    expect(cnpjValido('123')).toBe(false);
  });

  it('máscaras', () => {
    expect(mascaraCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascaraCpf('52998224725')).toBe('529.982.247-25');
    expect(mascaraCelular('44999990000')).toBe('(44) 99999-0000');
    expect(mascaraCep('87200000')).toBe('87200-000');
  });

  it('cada etapa cobra o que é dela', () => {
    const c = cadastroVazio();
    expect(Object.keys(errosEtapa(0, c))).toEqual(['cnpj', 'razao', 'fantasia']);
    expect(errosEtapa(3, c).recebimento).toBeDefined();
    expect(errosEtapa(4, c).cartaoCnpj).toBeDefined();
    expect(errosEtapa(5, c).aceite).toBeDefined();
    for (let i = 0; i < 6; i++) expect(errosEtapa(i, completo())).toEqual({});
  });

  it('aponta a primeira etapa pendente', () => {
    expect(etapaPendente(completo())).toBe(-1);
    const c = completo();
    c.documentos = {};
    expect(etapaPendente(c)).toBe(4);
  });

  it('documentos: PDF, JPG ou PNG até 5 MB', () => {
    expect(erroDocumento({ type: 'application/pdf', size: 1 })).toBeNull();
    expect(erroDocumento({ type: 'image/gif', size: 1 })).toMatch(/PDF/);
    expect(erroDocumento({ type: 'image/png', size: 5_000_001 })).toMatch(/5 MB/);
  });
});
