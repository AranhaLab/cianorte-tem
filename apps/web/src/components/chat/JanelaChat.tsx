'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Icone } from '@/components/ui/Icone';
import { MODO_DEMO } from '@/lib/demo';
import { LIMITE_TEXTO_CHAT, erroImagemChat, tamanhoLegivel } from '@/lib/regras/posVenda';
import { useComprador } from '@/stores/comprador';
import { useConversas } from '@/stores/conversas';
import type { MensagemChat } from '@/types/domain';

const hora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

/**
 * Conversa de um subpedido (PRD-13). Texto e imagem (JPG/PNG/WebP até 5 MB).
 * `lado` define de que ponto de vista a conversa é mostrada.
 */
export function JanelaChat({
  subpedidoId,
  lado,
  nomeOutroLado,
}: {
  subpedidoId: string;
  lado: 'comprador' | 'loja';
  nomeOutroLado: string;
}) {
  const conversa = useConversas((s) => s.conversas[subpedidoId]);
  const { enviar, marcarLida } = useConversas.getState();
  const avisar = useComprador.getState().avisar;
  const [texto, setTexto] = useState('');
  const [imagem, setImagem] = useState<NonNullable<MensagemChat['imagem']> | null>(null);
  const lista = useRef<HTMLOListElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const qtd = conversa?.mensagens.length ?? 0;

  useEffect(() => {
    marcarLida(subpedidoId, lado);
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [qtd, subpedidoId, lado, marcarLida]);

  if (!conversa) return null;

  const escolherImagem = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const erro = erroImagemChat(f);
    if (erro) return avisar(erro);
    setImagem({ nome: f.name, tamanhoBytes: f.size, tipo: f.type, previa: URL.createObjectURL(f) });
  };

  const mandar = (e: FormEvent) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t && !imagem) return;
    enviar(subpedidoId, { autor: lado, texto: t, ...(imagem ? { imagem } : {}) });
    setTexto('');
    setImagem(null);
    // Demonstração: a loja responde sozinha para mostrar o vai e volta.
    if (MODO_DEMO && lado === 'comprador')
      setTimeout(
        () =>
          enviar(subpedidoId, {
            autor: 'loja',
            texto:
              'Recebemos sua mensagem! Já vamos verificar e te respondemos por aqui. (resposta automática da demonstração)',
          }),
        1500,
      );
  };

  return (
    <div className="flex h-[clamp(360px,calc(100dvh-280px),640px)] flex-col overflow-hidden rounded-xl border border-solid border-borda bg-branco">
      <ol
        ref={lista}
        aria-label={`Mensagens com ${nomeOutroLado}`}
        aria-live="polite"
        className="m-0 flex flex-1 list-none flex-col gap-2.5 overflow-y-auto bg-neutro-50 p-4"
      >
        {conversa.mensagens.length === 0 && (
          <li className="m-auto max-w-[320px] text-center text-[13px] text-grafite-2">
            Nenhuma mensagem ainda. Tire dúvidas sobre o pedido, troca ou entrega com {nomeOutroLado}.
          </li>
        )}
        {conversa.mensagens.map((m) => {
          const minha = m.autor === lado;
          return (
            <li
              key={m.id}
              className={`flex max-w-[80%] flex-col gap-1 ${minha ? 'items-end self-end' : 'self-start'}`}
            >
              <div
                className={`flex flex-col gap-2 rounded-[16px] px-3.5 py-2.5 text-sm ${
                  minha
                    ? 'rounded-br-[4px] bg-marinho text-branco'
                    : 'rounded-bl-[4px] border border-solid border-borda bg-branco'
                }`}
              >
                <span className="sr-only">{minha ? 'Você' : nomeOutroLado}: </span>
                {m.imagem &&
                  (m.imagem.previa ? (
                    // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob), sem otimização
                    <img
                      src={m.imagem.previa}
                      alt={`Imagem enviada: ${m.imagem.nome}`}
                      className="max-h-60 rounded-[10px] object-cover"
                    />
                  ) : (
                    <span className="flex items-center gap-1.5 text-[13px] opacity-90">
                      <Icone nome="clip" tamanho="sm" />
                      {m.imagem.nome} · {tamanhoLegivel(m.imagem.tamanhoBytes)}
                    </span>
                  ))}
                {m.texto && <span className="whitespace-pre-wrap break-words">{m.texto}</span>}
              </div>
              <span className="text-[11px] text-grafite-2">{hora(m.enviadaEm)}</span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={mandar} className="flex flex-col gap-2 border-t border-solid border-borda p-3">
        {imagem && (
          <div className="flex items-center gap-2 rounded-[12px] bg-azul-nevoa px-3 py-2 text-[13px] text-azul-escuro">
            <Icone nome="clip" tamanho="sm" />
            <span className="flex-1 truncate">
              {imagem.nome} · {tamanhoLegivel(imagem.tamanhoBytes)}
            </span>
            <button
              type="button"
              className="icon-btn h-9 w-9 text-azul-escuro hover:bg-branco"
              aria-label="Remover imagem"
              onClick={() => setImagem(null)}
            >
              <Icone nome="x" tamanho="sm" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={arquivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={escolherImagem}
            aria-label="Anexar imagem (até 5 MB)"
            tabIndex={-1}
          />
          <button
            type="button"
            className="icon-btn flex-none text-azul hover:bg-azul-nevoa"
            aria-label="Anexar imagem (JPG, PNG ou WebP até 5 MB)"
            onClick={() => arquivo.current?.click()}
          >
            <Icone nome="clip" />
          </button>
          <label htmlFor={`msg-${subpedidoId}`} className="sr-only">
            Mensagem
          </label>
          <textarea
            id={`msg-${subpedidoId}`}
            rows={1}
            maxLength={LIMITE_TEXTO_CHAT}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
            placeholder="Escreva uma mensagem"
            className="input min-h-11 flex-1 resize-none py-2.5"
          />
          <button type="submit" className="btn btn-primary flex-none" disabled={!texto.trim() && !imagem}>
            <Icone nome="send" tamanho="sm" />
            Enviar
          </button>
        </div>
        <span className="dica">
          Não compartilhe dados de cartão ou senhas. Imagens: JPG, PNG ou WebP até 5 MB.
        </span>
      </form>
    </div>
  );
}
