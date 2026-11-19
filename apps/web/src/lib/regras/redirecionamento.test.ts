import { describe, expect, it } from 'vitest';
import { destinoSeguro, linkEntrar } from './redirecionamento';

describe('volta depois do login', () => {
  it('volta para a tela de origem dentro do site', () => {
    expect(destinoSeguro('/p/p1')).toBe('/p/p1');
    expect(destinoSeguro('/c/moda?ord=menor')).toBe('/c/moda?ord=menor');
    expect(destinoSeguro('/painel/anuncios', '/painel')).toBe('/painel/anuncios');
    expect(destinoSeguro('checkout')).toBe('/checkout');
  });

  it('sem origem, vai para o padrão (home)', () => {
    expect(destinoSeguro(null)).toBe('/');
    expect(destinoSeguro(undefined, '/painel')).toBe('/painel');
  });

  it('recusa destinos fora do site ou de volta ao login', () => {
    for (const ruim of [
      'https://golpe.com',
      '//golpe.com',
      '/\\golpe.com',
      'javascript:alert(1)',
      'conta',
      '/entrar',
      '/cadastro?next=/x',
      '/lojista/entrar',
      '/a\nb',
      `/${'x'.repeat(400)}`,
    ])
      expect(destinoSeguro(ruim)).toBe('/');
  });

  it('link de entrar guarda a tela atual', () => {
    expect(linkEntrar('/p/p1')).toBe('/entrar?next=%2Fp%2Fp1');
    expect(linkEntrar('/')).toBe('/entrar');
    expect(linkEntrar('/entrar')).toBe('/entrar');
    expect(linkEntrar('/painel/pedidos', '/lojista/entrar')).toBe('/lojista/entrar?next=%2Fpainel%2Fpedidos');
  });
});
