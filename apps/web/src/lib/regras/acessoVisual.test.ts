import { describe, expect, it } from 'vitest';
import { bannerAtivo, destinoValido, padraoAcesso } from './acessoVisual';
import { TENANTS } from '@/mocks/tenants';

describe('campanhas nas telas de acesso', () => {
  it('respeita datas inclusivas e banner desativado', () => {
    const b = {
      ...padraoAcesso(TENANTS.cianorte!, 'entrar').banner,
      ativo: true,
      imagem: 'imagem',
      inicio: '2026-11-22',
      fim: '2026-11-23',
    };
    expect(bannerAtivo(b, new Date('2026-11-22T15:00:00Z'))).toBe(true);
    expect(bannerAtivo(b, new Date('2026-11-24T02:00:00Z'))).toBe(true);
    expect(bannerAtivo(b, new Date('2026-11-24T03:00:00Z'))).toBe(false);
    expect(bannerAtivo({ ...b, ativo: false }, new Date('2026-11-22T15:00:00Z'))).toBe(false);
  });
  it('rejeita endereços inseguros e aceita rotas locais ou https', () => {
    expect(destinoValido('/loja/vale-azul')).toBe(true);
    expect(destinoValido('https://example.com')).toBe(true);
    expect(destinoValido('//example.com')).toBe(false);
    expect(destinoValido('javascript:alert(1)')).toBe(false);
  });
});
