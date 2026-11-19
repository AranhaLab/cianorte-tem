'use client';

import { useState, type FormEvent } from 'react';
import { useComprador } from '@/stores/comprador';
import type { Loja } from '@/types/domain';

/** Os dados acrescentados nesta demonstração ficam apenas neste navegador. */
export function ResumoAvaliacoes({
  loja,
  mostrarComentarios = false,
}: {
  loja: Loja;
  mostrarComentarios?: boolean;
}) {
  const avaliacoes = useComprador((s) => s.avaliacoes ?? []);
  const pedidos = useComprador((s) => s.pedidos);
  const locais = avaliacoes.filter((a) => a.lojaId === loja.id);
  const vendasLocais = pedidos
    .filter((p) => p.pago)
    .flatMap((p) => p.subpedidos)
    .filter((sp) => sp.lojaId === loja.id && sp.status !== 'cancelado')
    .flatMap((sp) => sp.itens ?? [])
    .reduce((total, item) => total + item.quantidade, 0);
  const quantidade = loja.avaliacoes + locais.length;
  const media = quantidade
    ? (loja.nota * loja.avaliacoes + locais.reduce((soma, a) => soma + a.nota, 0)) / quantidade
    : 0;
  return (
    <div className="flex flex-col gap-2 text-sm text-grafite-2">
      <span>
        ★ {media.toFixed(1)} · {quantidade.toLocaleString('pt-BR')} avaliações ·{' '}
        {((loja.itensVendidos ?? 0) + vendasLocais).toLocaleString('pt-BR')} itens vendidos
      </span>
      {mostrarComentarios &&
        locais.map((a) => (
          <div key={`${a.usuarioId}-${a.subpedidoId}`} className="rounded-lg bg-neutro-100 p-3">
            <b>{a.nota} de 5 estrelas</b>
            {a.comentario && <p className="mb-0 mt-1">{a.comentario}</p>}
          </div>
        ))}
    </div>
  );
}

export function AvaliarLoja({ subpedidoId, lojaNome }: { subpedidoId: string; lojaNome: string }) {
  const usuario = useComprador((s) => s.usuario);
  const avaliacoes = useComprador((s) => s.avaliacoes ?? []);
  const avaliarLoja = useComprador((s) => s.avaliarLoja);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const avaliada = avaliacoes.some((a) => a.subpedidoId === subpedidoId && a.usuarioId === usuario?.id);
  if (avaliada)
    return <p className="m-0 text-sm text-verde-texto">Sua avaliação desta loja foi registrada.</p>;
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    avaliarLoja(subpedidoId, nota, comentario);
  };
  return (
    <form onSubmit={enviar} className="flex flex-col gap-2 rounded-lg bg-neutro-100 p-3">
      <b>Avalie sua compra na {lojaNome}</b>
      <label htmlFor={`nota-${subpedidoId}`}>Nota da loja</label>
      <select
        id={`nota-${subpedidoId}`}
        className="input"
        value={nota}
        onChange={(e) => setNota(Number(e.target.value))}
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? 'estrela' : 'estrelas'}
          </option>
        ))}
      </select>
      <label htmlFor={`comentario-${subpedidoId}`}>Comentário (opcional)</label>
      <textarea
        id={`comentario-${subpedidoId}`}
        className="input"
        maxLength={500}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      <button className="btn btn-primary self-start" type="submit">
        Enviar avaliação
      </button>
      <span className="text-xs text-grafite-2">Na demonstração, a avaliação fica salva neste aparelho.</span>
    </form>
  );
}
