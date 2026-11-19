import { describe, expect, it } from 'vitest';
import { acessoDownload, chatLiberado, erroImagemChat, tamanhoLegivel } from './posVenda';

const arquivo = { formato: 'PDF' as const, tamanhoBytes: 8_400_000, limiteDownloads: 5, validadeDias: 30 };
const pagoEm = '2026-11-01T12:00:00.000Z';

describe('acessoDownload', () => {
  it('bloqueia antes do pagamento', () => {
    expect(acessoDownload({ arquivo, pagoEm: null, usados: 0 })).toMatchObject({
      liberado: false,
      motivo: 'aguardando_pagamento',
      restantes: 5,
    });
  });

  it('libera após o pagamento e conta os restantes', () => {
    const a = acessoDownload({ arquivo, pagoEm, usados: 2, agora: new Date('2026-11-10T00:00:00Z') });
    expect(a.liberado).toBe(true);
    expect(a.restantes).toBe(3);
    expect(a.expiraEm?.toISOString()).toBe('2026-12-01T12:00:00.000Z');
  });

  it('bloqueia ao atingir o limite', () => {
    expect(
      acessoDownload({ arquivo, pagoEm, usados: 5, agora: new Date('2026-11-10T00:00:00Z') }),
    ).toMatchObject({ liberado: false, motivo: 'limite', restantes: 0 });
  });

  it('bloqueia depois do prazo', () => {
    expect(
      acessoDownload({ arquivo, pagoEm, usados: 0, agora: new Date('2026-12-01T12:00:01Z') }),
    ).toMatchObject({ liberado: false, motivo: 'expirado' });
  });
});

describe('chat pós-compra', () => {
  it('abre só depois do pagamento confirmado e não em cancelado', () => {
    expect(chatLiberado('realizado')).toBe(false);
    expect(chatLiberado('cancelado')).toBe(false);
    expect(chatLiberado('pagamento_confirmado')).toBe(true);
    expect(chatLiberado('entregue')).toBe(true);
  });

  it('aceita JPG, PNG e WebP até 5 MB', () => {
    expect(erroImagemChat({ type: 'image/png', size: 5_000_000 })).toBeNull();
    expect(erroImagemChat({ type: 'image/webp', size: 10 })).toBeNull();
    expect(erroImagemChat({ type: 'image/jpeg', size: 5_000_001 })).toMatch(/5 MB/);
    expect(erroImagemChat({ type: 'image/gif', size: 10 })).toMatch(/JPG, PNG ou WebP/);
    expect(erroImagemChat({ type: 'application/pdf', size: 10 })).not.toBeNull();
  });

  it('formata tamanhos', () => {
    expect(tamanhoLegivel(8_400_000)).toBe('8,4 MB');
    expect(tamanhoLegivel(250_000)).toBe('250 KB');
    expect(tamanhoLegivel(10)).toBe('1 KB');
  });
});
