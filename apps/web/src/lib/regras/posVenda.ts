/**
 * Regras de pós-venda do front: produtos digitais (PRD-15) e chat (PRD-13).
 * O servidor repete todas: link de download temporário e privado, e conversa
 * acessível só por quem participa do subpedido.
 */
import type { ArquivoDigital, StatusSubpedido } from '@/types/domain';

const DIA = 24 * 60 * 60 * 1000;

export type MotivoBloqueio = 'aguardando_pagamento' | 'limite' | 'expirado';

/**
 * Acesso ao arquivo comprado [PROPOSTA]: só depois do pagamento confirmado,
 * até `limiteDownloads` vezes e por `validadeDias` a partir do pagamento.
 */
export function acessoDownload(i: {
  arquivo: ArquivoDigital;
  pagoEm: string | null;
  usados: number;
  agora?: Date;
}): { liberado: boolean; motivo?: MotivoBloqueio; restantes: number; expiraEm: Date | null } {
  const restantes = Math.max(0, i.arquivo.limiteDownloads - i.usados);
  if (!i.pagoEm) return { liberado: false, motivo: 'aguardando_pagamento', restantes, expiraEm: null };
  const expiraEm = new Date(new Date(i.pagoEm).getTime() + i.arquivo.validadeDias * DIA);
  if ((i.agora ?? new Date()) > expiraEm) return { liberado: false, motivo: 'expirado', restantes, expiraEm };
  if (restantes === 0) return { liberado: false, motivo: 'limite', restantes, expiraEm };
  return { liberado: true, restantes, expiraEm };
}

/** "8,4 MB" */
export const tamanhoLegivel = (bytes: number) =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1).replace('.', ',')} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;

/** [PROPOSTA] O chat abre quando o pagamento é confirmado e fica aberto depois da entrega. */
export const chatLiberado = (status: StatusSubpedido) => status !== 'realizado' && status !== 'cancelado';

export const LIMITE_IMAGEM_CHAT = 5_000_000; // 5 MB (CLAUDE.md §16)
export const TIPOS_IMAGEM_CHAT = ['image/jpeg', 'image/png', 'image/webp'];
export const LIMITE_TEXTO_CHAT = 1000;

/** Valida a imagem antes de enviar. Retorna a mensagem de erro, ou null se estiver ok. */
export function erroImagemChat(arquivo: { type: string; size: number }): string | null {
  if (!TIPOS_IMAGEM_CHAT.includes(arquivo.type)) return 'Envie uma imagem JPG, PNG ou WebP.';
  if (arquivo.size > LIMITE_IMAGEM_CHAT) return 'A imagem passa de 5 MB. Envie uma menor.';
  return null;
}
