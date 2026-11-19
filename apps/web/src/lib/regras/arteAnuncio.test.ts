import { describe, expect, it } from 'vitest';
import {
  criativoDaArte,
  erroArquivoArte,
  errosArte,
  medidas,
  podeEnviarArte,
  qualidadeArte,
  sigla,
} from './arteAnuncio';
import type { ArteAnuncio } from '@/types/domain';

const arte = (x: Partial<ArteAnuncio> = {}): ArteAnuncio => ({
  modo: 'montar',
  imagem: { nome: 'a.webp', tamanhoBytes: 1000, largura: 1600, altura: 640, dados: 'data:' },
  enquadramento: { zoom: 1, x: 50, y: 50 },
  efeito: 'degrade',
  cor: '#1F4FA3',
  titulo: 'Semana da moda',
  sub: '',
  cta: 'Ver ofertas',
  destino: '/loja/vale-azul',
  ...x,
});
const H1 = { formato: { desktop: '1200 × 400 px', mobile: '800 × 600 px', proporcao: '3:1' } };

describe('arte do anúncio', () => {
  it('só envia arte com o espaço garantido', () => {
    expect(podeEnviarArte('aguardando_arte')).toBe(true);
    expect(podeEnviarArte('reprovada')).toBe(true);
    expect(podeEnviarArte('lance_ativo')).toBe(false);
    expect(podeEnviarArte('no_ar')).toBe(false);
  });

  it('lê as medidas da vaga', () => {
    expect(medidas('1200 × 400 px')).toEqual({ w: 1200, h: 400 });
    expect(medidas('2 × 580 × 240 px')).toEqual({ w: 580, h: 240 });
  });

  it('arquivo: tipo e 500 KB', () => {
    expect(erroArquivoArte({ type: 'image/webp', size: 500_000 })).toBeNull();
    expect(erroArquivoArte({ type: 'image/webp', size: 500_001 })).toMatch(/500 KB/);
    expect(erroArquivoArte({ type: 'image/gif', size: 1 })).toMatch(/JPG, PNG ou WebP/);
  });

  it('qualidade conforme a ampliação necessária', () => {
    expect(qualidadeArte({ largura: 1600, altura: 640 }, { w: 1200, h: 400 }).nivel).toBe('boa');
    expect(qualidadeArte({ largura: 1000, altura: 340 }, { w: 1200, h: 400 }).nivel).toBe('aceitavel');
    expect(qualidadeArte({ largura: 1600, altura: 640 }, { w: 1200, h: 400 }, 2).nivel).toBe('baixa');
  });

  it('montar exige título e véu; pronta exige texto alternativo', () => {
    expect(errosArte(arte(), H1)).toEqual({});
    expect(errosArte(arte({ titulo: ' ' }), H1).titulo).toBeDefined();
    expect(errosArte(arte({ efeito: 'nenhum' }), H1).efeito).toBeDefined();
    expect(errosArte(arte({ modo: 'pronta', efeito: 'nenhum', titulo: 'oi' }), H1).titulo).toMatch(
      /texto alternativo/,
    );
    expect(errosArte(arte({ modo: 'pronta', efeito: 'nenhum', titulo: 'Liquidação de verão' }), H1)).toEqual(
      {},
    );
    expect(errosArte(arte({ enquadramento: { zoom: 2.5, x: 50, y: 50 } }), H1).imagem).toMatch(/nitidez/);
  });

  it('criativo leva a marca da loja e escolhe a cor do texto', () => {
    const c = criativoDaArte(arte({ cor: '#F7F6F2' }), 'H1', {
      nome: 'Confecções Vale Azul',
      cor: '#1F4FA3',
    });
    expect(c.marca).toEqual({ nome: 'Confecções Vale Azul', cor: '#1F4FA3' });
    expect(c.texto).toBe('#14213D');
    expect(criativoDaArte(arte(), 'H1', { nome: 'X', cor: '#000000' }).texto).toBe('#FFFFFF');
    expect(sigla('Confecções Vale Azul')).toBe('CV');
    expect(sigla('Casa & Obra Noroeste')).toBe('CO');
  });
});
