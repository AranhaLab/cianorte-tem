import { describe, expect, it } from 'vitest';
import { hexToRgbTriplet, resolveTenantSlug } from '@/lib/tenant/resolve';
import { celularValido, cpfValido, emailValido, formatarCep, senhaValida } from './cadastro';
import { desconto, paraCentavos, reais } from './dinheiro';
import { proximoStatus } from './pedidos';

describe('dinheiro em centavos', () => {
  it('formata em reais', () => {
    expect(reais(8990)).toBe('R$ 89,90');
    expect(reais(129900)).toBe('R$ 1.299,00');
  });
  it('lê o que a pessoa digita', () => {
    expect(paraCentavos('89,90')).toBe(8990);
    expect(paraCentavos('R$ 1.234,56')).toBe(123456);
    expect(paraCentavos('abc')).toBeNaN();
  });
  it('calcula o percentual de desconto', () => {
    expect(desconto({ precoCentavos: 8990, precoDeCentavos: 11990 })).toBe(25);
    expect(desconto({ precoCentavos: 8990, precoDeCentavos: null })).toBe(0);
  });
});

describe('cadastro (CLAUDE.md §6)', () => {
  it('valida CPF pelos dígitos verificadores', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('529.982.247-26')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(cpfValido('123')).toBe(false);
  });
  it('senha com 8+ caracteres, letras e números', () => {
    expect(senhaValida('Demo12345')).toBe(true);
    expect(senhaValida('12345678')).toBe(false);
    expect(senhaValida('abcdefgh')).toBe(false);
    expect(senhaValida('ab1')).toBe(false);
  });
  it('e-mail, celular e CEP', () => {
    expect(emailValido('a@b.com')).toBe(true);
    expect(emailValido('a@b')).toBe(false);
    expect(celularValido('(44) 99999-0000')).toBe(true);
    expect(celularValido('99999-0000')).toBe(false);
    expect(formatarCep('87200100')).toBe('87200-100');
  });
});

describe('estados do subpedido (CLAUDE.md §5.6)', () => {
  it('sem pagamento confirmado não avança', () => {
    expect(proximoStatus('entrega', 'realizado')).toBeNull();
  });
  it('entrega e retirada seguem fluxos diferentes', () => {
    expect(proximoStatus('entrega', 'em_separacao')).toBe('pronto_envio');
    expect(proximoStatus('retirada', 'em_separacao')).toBe('pronto_retirada');
  });
  it('estados finais e cancelado não avançam', () => {
    expect(proximoStatus('entrega', 'entregue')).toBeNull();
    expect(proximoStatus('retirada', 'retirado')).toBeNull();
    expect(proximoStatus('entrega', 'cancelado')).toBeNull();
  });
});

describe('white label: cidade pelo domínio (CLAUDE.md §2)', () => {
  it('subdomínio e domínio próprio', () => {
    expect(resolveTenantSlug('cianorte.localhost:3000', 'x')).toBe('cianorte');
    expect(resolveTenantSlug('maringatem.com.br', 'x')).toBe('maringa');
  });
  it('host desconhecido usa a cidade padrão, se existir', () => {
    expect(resolveTenantSlug('localhost:3000', 'cianorte')).toBe('cianorte');
    expect(resolveTenantSlug('localhost:3000', 'atlantida')).toBeNull();
  });
  it('acento vira variável CSS', () => {
    expect(hexToRgbTriplet('#D7263D')).toBe('215 38 61');
  });
});
