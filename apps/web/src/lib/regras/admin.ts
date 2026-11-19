/**
 * Regras da administração da plataforma (CLAUDE.md §4, §5.3, §5.5, §5.6 e §16).
 * O servidor repete todas e grava cada decisão na auditoria.
 */
import type { Centavos } from '@/types/domain';

/** Toda decisão que nega, bloqueia ou muda regra exige motivo (vai para a auditoria). [PROPOSTA] mínimo de 10 caracteres. */
export const MOTIVO_MINIMO = 10;
export const motivoValido = (m: string) => m.trim().length >= MOTIVO_MINIMO;

/** Percentuais ILUSTRATIVOS até a definição do PO-03. */
export const COMISSAO_PADRAO = 10;
export const TAXA_PAGAMENTO = 2;
export const COMISSAO_MAXIMA = 30; // [PROPOSTA] teto de segurança da tela

/**
 * Repasse de um subpedido (§5.5): comissão uniforme SÓ sobre produtos; o frete é da loja;
 * a taxa do provedor incide sobre o valor cobrado e é descontada da loja uma única vez.
 */
export function repasse(
  v: { produtosCentavos: Centavos; freteCentavos: Centavos },
  comissaoPercentual: number,
  taxaPercentual = TAXA_PAGAMENTO,
) {
  const comissao = Math.round((v.produtosCentavos * comissaoPercentual) / 100);
  const taxa = Math.round(((v.produtosCentavos + v.freteCentavos) * taxaPercentual) / 100);
  return { comissao, taxa, liquido: v.produtosCentavos + v.freteCentavos - comissao - taxa };
}

/** Selo "Loja oficial" (§5.3): registro de marca + cartão CNPJ + contrato social, sem volume mínimo. */
export const podeSerOficial = (d: { cartaoCnpj: boolean; contratoSocial: boolean; registroMarca: boolean }) =>
  d.cartaoCnpj && d.contratoSocial && d.registroMarca;

/**
 * Selo "Indicada" (§5.3): ganha com ≥ 100 pedidos em um dia; mantém com média diária ≥ 100
 * nos últimos 6 meses (revisão semestral). Automático: o admin só acompanha.
 */
export const INDICADA_MINIMO = 100;
export function situacaoIndicada(m: { maiorDia: number; mediaDiaria6m: number; indicada: boolean }) {
  if (!m.indicada) return m.maiorDia >= INDICADA_MINIMO ? 'conquista' : 'nao_elegivel';
  return m.mediaDiaria6m >= INDICADA_MINIMO ? 'mantem' : 'perde_na_revisao';
}

/** Cadastro de loja só é aprovado com o cartão CNPJ e o aceite do contrato (§7.1). */
export const cadastroCompleto = (d: { cartaoCnpj: boolean; contratoAceito: boolean }) =>
  d.cartaoCnpj && d.contratoAceito;
