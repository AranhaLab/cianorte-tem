/**
 * Estados do subpedido (CLAUDE.md §5.6). Cada loja avança só a sua parte, e só
 * depois do pagamento confirmado. Financeiro e operação são dimensões separadas.
 */
import type { ModoEntrega, StatusSubpedido } from '@/types/domain';

export const ROTULO_STATUS: Record<StatusSubpedido, string> = {
  realizado: 'Pedido realizado',
  pagamento_confirmado: 'Pagamento confirmado',
  em_separacao: 'Em separação',
  pronto_envio: 'Pronto para envio',
  saiu_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  pronto_retirada: 'Pronto para retirada',
  retirado: 'Retirado',
  cancelado: 'Cancelado',
};

export const FLUXO: Record<ModoEntrega, StatusSubpedido[]> = {
  entrega: ['realizado', 'pagamento_confirmado', 'em_separacao', 'pronto_envio', 'saiu_entrega', 'entregue'],
  retirada: ['realizado', 'pagamento_confirmado', 'em_separacao', 'pronto_retirada', 'retirado'],
};

/** Próximo estado que a LOJA pode aplicar. `null` se concluído, cancelado ou ainda sem pagamento. */
export function proximoStatus(modo: ModoEntrega, atual: StatusSubpedido): StatusSubpedido | null {
  if (atual === 'realizado' || atual === 'cancelado') return null; // só pagamento confirmado libera
  const f = FLUXO[modo];
  const i = f.indexOf(atual);
  return i >= 0 && i < f.length - 1 ? (f[i + 1] ?? null) : null;
}
