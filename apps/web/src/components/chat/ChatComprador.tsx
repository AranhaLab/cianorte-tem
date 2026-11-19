'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { CabecalhoPagina, CaixaVazia, Migalhas } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { api } from '@/lib/api';
import { chatLiberado } from '@/lib/regras/posVenda';
import { useComprador } from '@/stores/comprador';
import { useConversas } from '@/stores/conversas';
import type { Loja } from '@/types/domain';
import { JanelaChat } from './JanelaChat';

/** Conversa do comprador com a loja de um subpedido (só quem comprou acessa). */
export function ChatComprador({ pedidoId, subpedidoId }: { pedidoId: string; subpedidoId: string }) {
  const tenant = useTenant();
  const usuario = useComprador((s) => s.usuario);
  const pedido = useComprador((s) => s.pedidos.find((p) => p.id === pedidoId));
  const sub = pedido?.subpedidos.find((s) => s.id === subpedidoId);
  const hidratado = useConversas((s) => s.hidratado);
  const [loja, setLoja] = useState<Loja | null>(null);

  useEffect(() => {
    void useConversas.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (sub)
      void api.lojas.listar(tenant.slug).then((ls) => setLoja(ls.find((l) => l.id === sub.lojaId) ?? null));
  }, [sub, tenant.slug]);
  useEffect(() => {
    if (hidratado && sub && pedido && chatLiberado(sub.status))
      useConversas.getState().garantir({
        subpedidoId: sub.id,
        pedidoId: pedido.id,
        lojaId: sub.lojaId,
        cliente: usuario?.nome ?? 'Comprador',
      });
  }, [hidratado, sub, pedido, usuario]);

  if (!pedido || !sub)
    return (
      <CaixaVazia
        icone="chat"
        titulo="Conversa não encontrada"
        texto="Só quem fez a compra pode conversar com a loja sobre ela."
        acao={
          <Link href="/conta/pedidos" className="btn btn-primary">
            Meus pedidos
          </Link>
        }
      />
    );

  return (
    <>
      <Migalhas
        itens={[
          { rotulo: 'Meus pedidos', href: '/conta/pedidos' },
          { rotulo: `Pedido nº ${pedido.id}`, href: `/pedido/${pedido.id}` },
          { rotulo: 'Conversa' },
        ]}
      />
      <CabecalhoPagina
        titulo={`Conversa com ${loja?.nome ?? 'a loja'}`}
        apoio={`Subpedido ${sub.id} · a conversa fica ligada a esta compra`}
      />
      <div className="my-4 max-w-[760px]">
        {!chatLiberado(sub.status) ? (
          <div className="banner-info bg-aviso-claro text-aviso-texto">
            <Icone nome="clock" />
            <span>A conversa com a loja abre assim que o pagamento for confirmado.</span>
          </div>
        ) : hidratado ? (
          <JanelaChat subpedidoId={sub.id} lado="comprador" nomeOutroLado={loja?.nome ?? 'a loja'} />
        ) : (
          <div className="min-h-[40vh]" aria-busy="true" />
        )}
      </div>
    </>
  );
}
