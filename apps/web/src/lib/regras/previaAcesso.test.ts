import { describe, expect, it } from 'vitest';
import { MSG_PREVIA_CONFIG, mensagemPreviaValida } from './previaAcesso';

const origem = 'http://cianorte.localhost:3000';
const ok = { tipo: MSG_PREVIA_CONFIG, tela: 'entrar', config: { titulo: 'x' } };

describe('prévia das telas de acesso', () => {
  it('aceita só a própria origem, o tipo e a tela esperados', () => {
    expect(mensagemPreviaValida(origem, origem, ok, 'entrar')).toBe(true);
    expect(mensagemPreviaValida('https://outro.site', origem, ok, 'entrar')).toBe(false);
    expect(mensagemPreviaValida(origem, origem, ok, 'cadastro')).toBe(false);
    expect(mensagemPreviaValida(origem, origem, { ...ok, tipo: 'outro' }, 'entrar')).toBe(false);
    expect(mensagemPreviaValida(origem, origem, { ...ok, config: null }, 'entrar')).toBe(false);
    expect(mensagemPreviaValida(origem, origem, 'texto', 'entrar')).toBe(false);
  });
});
