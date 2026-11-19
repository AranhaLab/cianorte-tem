'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { api } from '@/lib/api';
import { acessoDownload, chatLiberado, tamanhoLegivel } from '@/lib/regras/posVenda';
import { useComprador } from '@/stores/comprador';
import { naoLidas, useConversas } from '@/stores/conversas';
import type { Loja } from '@/types/domain';

const data = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const MOTIVO: Record<string, string> = {
  aguardando_pagamento: 'Liberado após a confirmação do pagamento',
  limite: 'Limite de downloads atingido — fale com a loja',
  expirado: 'Prazo de acesso encerrado — fale com a loja',
};

/**
 * Área de downloads (PRD-15): arquivos de produtos digitais comprados.
 * Na versão real, "Baixar" pede ao servidor um link temporário e privado
 * (o arquivo nunca fica público) e o servidor conta o download.
 */
export function Downloads() {
  const pedidos = useComprador((s) => s.pedidos);
  const usados = useComprador((s) => s.downloads);
  const { registrarDownload, avisar } = useComprador.getState();

  const itens = pedidos.flatMap((p) =>
    p.subpedidos.flatMap((sp) =>
      (sp.itens ?? [])
        .filter((it) => it.digital)
        .map((it) => ({ pedido: p, item: it, chave: `${p.id}:${it.produtoId}` })),
    ),
  );

  if (!itens.length)
    return (
      <CaixaVazia
        icone="download"
        titulo="Nenhum arquivo ainda"
        texto="E-books, moldes e outros produtos digitais que você comprar aparecem aqui para baixar."
        acao={
          <Link href="/c/digitais" className="btn btn-primary">
            Ver produtos digitais
          </Link>
        }
      />
    );

  const baixar = (pedidoId: string, produtoId: string, nome: string) => {
    registrarDownload(pedidoId, produtoId);
    // Demonstração: um arquivo de texto no lugar do arquivo real.
    const blob = new Blob([`${nome}\n\nArquivo de demonstração do pedido ${pedidoId}.`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w]+/g, '-')}-demonstracao.txt`;
    a.click();
    URL.revokeObjectURL(url);
    avisar('Download iniciado.');
  };

  return (
    <div className="card flex flex-col">
      <h2 className="mb-1">Downloads</h2>
      <span className="text-[13px] text-grafite-2">
        Produtos digitais não têm frete. O arquivo é liberado quando o pagamento é confirmado.
      </span>
      {itens.map(({ pedido, item, chave }) => {
        const a = acessoDownload({
          arquivo: item.digital!,
          pagoEm: pedido.pagoEm ?? null,
          usados: usados[chave] ?? 0,
        });
        return (
          <div
            key={chave}
            className="mt-3 flex flex-wrap items-center gap-3 border-t border-solid border-borda pt-3"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-azul-nevoa text-azul">
              <Icone nome="book" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b className="text-sm">{item.nome}</b>
              <span className="text-xs text-grafite-2">
                {item.digital!.formato} · {tamanhoLegivel(item.digital!.tamanhoBytes)} · pedido nº {pedido.id}
              </span>
              <span className="text-xs text-grafite-2">
                {a.liberado
                  ? `${a.restantes} de ${item.digital!.limiteDownloads} downloads restantes · até ${data(a.expiraEm!)}`
                  : MOTIVO[a.motivo!]}
              </span>
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!a.liberado}
              onClick={() => baixar(pedido.id, item.produtoId, item.nome)}
            >
              <Icone nome="download" tamanho="sm" />
              Baixar
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Lista de conversas do comprador (uma por loja de cada pedido pago). */
export function Conversas() {
  const tenant = useTenant();
  const pedidos = useComprador((s) => s.pedidos);
  const conversas = useConversas((s) => s.conversas);
  const hidratado = useConversas((s) => s.hidratado);
  const [lojas, setLojas] = useState<Loja[]>([]);
  useEffect(() => {
    void useConversas.persist.rehydrate();
    void api.lojas.listar(tenant.slug).then(setLojas);
  }, [tenant.slug]);

  const subs = pedidos.flatMap((p) =>
    p.subpedidos.filter((sp) => chatLiberado(sp.status)).map((sp) => ({ p, sp })),
  );
  if (!hidratado) return <div className="min-h-40" aria-busy="true" />;
  if (!subs.length)
    return (
      <CaixaVazia
        icone="chat"
        titulo="Nenhuma conversa"
        texto="Depois que o pagamento de um pedido é confirmado, você pode conversar com cada loja por aqui."
      />
    );

  return (
    <div className="card flex flex-col">
      <h2 className="mb-1">Conversas</h2>
      {subs.map(({ p, sp }) => {
        const c = conversas[sp.id];
        const ultima = c?.mensagens.at(-1);
        const novas = c ? naoLidas(c, 'comprador') : 0;
        return (
          <Link
            key={sp.id}
            href={`/pedido/${p.id}/chat/${sp.id}`}
            className="mt-2 flex min-h-toque items-center gap-3 border-t border-solid border-borda pt-2.5 text-grafite hover:text-marinho"
          >
            <Icone nome="chat" />
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="text-sm">{lojas.find((l) => l.id === sp.lojaId)?.nome ?? sp.lojaId}</b>
              <span className="truncate text-xs text-grafite-2">
                {ultima ? ultima.texto || 'Imagem' : 'Sem mensagens ainda'} · subpedido {sp.id}
              </span>
            </span>
            {novas > 0 && (
              <span className="rounded-full bg-acento px-2 py-0.5 text-xs font-bold text-branco">
                {novas} nova{novas > 1 ? 's' : ''}
              </span>
            )}
            <Icone nome="chevR" tamanho="sm" />
          </Link>
        );
      })}
    </div>
  );
}
