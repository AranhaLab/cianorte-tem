'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { JanelaChat } from '@/components/chat/JanelaChat';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { naoLidas, useConversas } from '@/stores/conversas';
import { TituloPainel } from './Comum';
import { useLojaPainel } from './PainelContexto';

/**
 * Conversas da loja (protótipo anterior: "Chat pós-compra" no painel).
 * Cada conversa é de um subpedido; a loja só vê as suas (CLAUDE.md §4 e PRD-13).
 */
export function ConversasLojista({ selecionada }: { selecionada?: string }) {
  const { loja } = useLojaPainel();
  const hidratado = useConversas((s) => s.hidratado);
  const todas = useConversas((s) => s.conversas);
  useEffect(() => {
    void useConversas.persist.rehydrate();
  }, []);

  const minhas = Object.values(todas)
    .filter((c) => c.lojaId === loja.id)
    .sort((a, b) => (b.mensagens.at(-1)?.enviadaEm ?? '').localeCompare(a.mensagens.at(-1)?.enviadaEm ?? ''));
  const atual = minhas.find((c) => c.subpedidoId === selecionada) ?? minhas[0];

  return (
    <>
      <TituloPainel
        titulo="Conversas"
        apoio="Dúvidas e combinados de cada pedido. Responda pelo painel; o comprador vê na conta dele."
      />
      {!hidratado ? (
        <div className="min-h-[40vh]" aria-busy="true" />
      ) : !minhas.length ? (
        <CaixaVazia
          icone="chat"
          titulo="Nenhuma conversa"
          texto="Quando um comprador escrever sobre um pedido, ela aparece aqui."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <nav
            aria-label="Conversas"
            className="flex flex-col gap-1 self-start rounded-xl border border-solid border-borda-fria bg-branco p-2"
          >
            {minhas.map((c) => {
              const novas = naoLidas(c, 'loja');
              const ativa = c.subpedidoId === atual?.subpedidoId;
              return (
                <Link
                  key={c.subpedidoId}
                  href={`/painel/conversas?c=${c.subpedidoId}`}
                  scroll={false}
                  aria-current={ativa ? 'true' : undefined}
                  className={`flex min-h-toque items-center gap-2.5 rounded-[12px] px-3 py-2 ${
                    ativa ? 'bg-azul-nevoa text-marinho' : 'text-grafite hover:bg-linho hover:text-marinho'
                  }`}
                >
                  <Icone nome="chat" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <b className="text-sm">
                      {c.cliente} · {c.subpedidoId}
                    </b>
                    <span className="truncate text-xs text-grafite-2">
                      {c.mensagens.at(-1)?.texto || (c.mensagens.length ? 'Imagem' : 'Sem mensagens')}
                    </span>
                  </span>
                  {novas > 0 && (
                    <span
                      className="rounded-full bg-acento px-2 py-0.5 text-xs font-bold text-branco"
                      aria-label={`${novas} não lidas`}
                    >
                      {novas}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          {atual && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-grafite-2">
                Pedido {atual.subpedidoId} · {atual.cliente}. Só você e o comprador deste pedido veem esta
                conversa.
              </span>
              <JanelaChat
                key={atual.subpedidoId}
                subpedidoId={atual.subpedidoId}
                lado="loja"
                nomeOutroLado={atual.cliente}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
