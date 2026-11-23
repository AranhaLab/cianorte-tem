'use client';

import type { ReactNode } from 'react';
import { Carregando } from '@/components/ui/Carregando';
import { reais } from '@/lib/regras/dinheiro';
import { proximoStatus, ROTULO_STATUS } from '@/lib/regras/pedidos';
import { useComprador } from '@/stores/comprador';
import { useAdmin } from '@/stores/admin';
import { usePainel } from '@/stores/painel';
import type { PedidoLojista, StatusSubpedido } from '@/types/domain';

export const avisar = (t: string) => useComprador.getState().avisar(t);

/** Título de tela do painel (protótipo: .page-head dentro do painel). */
export function TituloPainel({
  titulo,
  apoio,
  acao,
}: {
  titulo: string;
  apoio?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h1>{titulo}</h1>
        {apoio && <span className="text-[13px] text-grafite-2">{apoio}</span>}
      </div>
      {acao}
    </div>
  );
}

/** Espera o estado da demo carregar do aparelho antes de desenhar números. */
export function AguardaPainel({ children }: { children: ReactNode }) {
  const ok = usePainel((s) => s.hidratado);
  return ok ? children : <Carregando mensagem="Carregando painel..." />;
}

const COR_STATUS: Partial<Record<StatusSubpedido, string>> = {
  pagamento_confirmado: 'st-blue',
  em_separacao: 'st-amber',
  pronto_envio: 'st-blue',
  saiu_entrega: 'st-blue',
  pronto_retirada: 'st-blue',
  entregue: 'st-green',
  retirado: 'st-green',
  cancelado: 'st-red',
};

export function StatusPedido({ s }: { s: StatusSubpedido }) {
  return <span className={`status ${COR_STATUS[s] ?? 'st-gray'}`}>{ROTULO_STATUS[s]}</span>;
}

/**
 * Tabela de pedidos da loja. Só pedido com pagamento confirmado avança, e cada
 * loja avança apenas a sua parte (CLAUDE.md §5.6).
 */
export function TabelaPedidos({ pedidos }: { pedidos: PedidoLojista[] }) {
  const analises = useAdmin((s) => s.analises);
  const avancar = (id: string) => {
    const novo = usePainel.getState().avancarPedido(id);
    if (novo) avisar(`Pedido ${id}: ${ROTULO_STATUS[novo]}.`);
  };
  return (
    <div
      className="tabela-wrap"
      tabIndex={0}
      role="region"
      aria-label="Tabela (role para os lados no celular)"
    >
      <table className="tabela">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Quando</th>
            <th>Tipo</th>
            <th>Itens</th>
            <th>Total</th>
            <th>Situação</th>
            <th>
              <span className="sr-only">Ação</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((o) => {
            // Análise administrativa bloqueia o avanço (CLAUDE.md §5.6).
            const bloqueado = analises[o.id];
            const prox = bloqueado ? null : proximoStatus(o.modo, o.status);
            return (
              <tr key={o.id}>
                <td>
                  <b>{o.id}</b>
                  <br />
                  <span className="text-xs text-grafite-2">{o.cliente}</span>
                </td>
                <td>{o.quando}</td>
                <td>{o.modo === 'entrega' ? 'Entrega' : 'Retirada'}</td>
                <td>{o.itens}</td>
                <td>{reais(o.totalCentavos)}</td>
                <td>
                  <StatusPedido s={o.status} />
                </td>
                <td>
                  {prox ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-soft min-h-toque"
                      onClick={() => avancar(o.id)}
                    >
                      {ROTULO_STATUS[prox]}
                    </button>
                  ) : bloqueado ? (
                    <span className="status st-amber" title={bloqueado.motivo}>
                      Em análise pela plataforma
                    </span>
                  ) : (
                    <span className="text-xs text-grafite-2">Concluído</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
