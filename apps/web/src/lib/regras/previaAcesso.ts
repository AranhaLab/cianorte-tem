/**
 * Prévia ao vivo das telas de acesso (CLAUDE.md §13.18). O editor do admin abre a página
 * real num iframe com `?previa=1` e envia a configuração em edição por postMessage.
 */
export const MSG_PREVIA_PRONTA = 'ct-previa-acesso-pronta';
export const MSG_PREVIA_CONFIG = 'ct-previa-acesso-config';

/** Só aceita mensagens da própria origem, com o tipo e a tela esperados. */
export function mensagemPreviaValida(
  origemMensagem: string,
  origemPagina: string,
  dados: unknown,
  tela: string,
): dados is { tipo: typeof MSG_PREVIA_CONFIG; tela: string; config: Record<string, unknown> } {
  if (origemMensagem !== origemPagina || !dados || typeof dados !== 'object') return false;
  const d = dados as { tipo?: unknown; tela?: unknown; config?: unknown };
  return d.tipo === MSG_PREVIA_CONFIG && d.tela === tela && !!d.config && typeof d.config === 'object';
}
