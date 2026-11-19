/**
 * Disponibilidade pública (CLAUDE.md §5.3 e §8). O comprador NUNCA vê o saldo.
 * Disponível para venda = saldo − reserva de segurança − reservas de pedidos em aberto.
 * [PROPOSTA] "Últimas unidades" quando disponível ≤ estoque mínimo do lojista.
 */
import type { Disponibilidade } from '@/types/domain';

export function disponibilidadePublica(i: {
  saldo: number;
  reservaSeguranca: number;
  reservadoPedidos?: number;
  minimo: number;
}): Disponibilidade {
  const livre = i.saldo - i.reservaSeguranca - (i.reservadoPedidos ?? 0);
  if (livre <= 0) return 'indisponivel';
  if (livre <= i.minimo) return 'ultimas_unidades';
  return 'disponivel';
}

export const ROTULO_DISPONIBILIDADE: Record<Disponibilidade, string> = {
  disponivel: 'Disponível',
  ultimas_unidades: 'Últimas unidades',
  indisponivel: 'Indisponível',
};
