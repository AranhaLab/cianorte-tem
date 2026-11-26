'use client';

import Link from 'next/link';
import { useComprador } from '@/stores/comprador';

/**
 * Banner de cookies (LGPD, CLAUDE.md §6): "Aceitar todos" ou "Só necessários".
 * Cookies de medição e de anúncios só depois do aceite. A escolha muda em Conta › Privacidade.
 */
export function BannerCookies() {
  const mostrar = useComprador((s) => s.hidratado && s.cookies === null);
  // Na prévia do editor de telas de acesso (iframe com ?previa=1), o banner esconderia a tela.
  const emPrevia =
    typeof window !== 'undefined' &&
    window.parent !== window &&
    new URLSearchParams(window.location.search).get('previa') === '1';
  if (!mostrar || emPrevia) return null;
  const escolher = useComprador.getState().escolherCookies;
  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed bottom-[calc(100px+env(safe-area-inset-bottom))] left-3 right-3 z-[60] mx-auto flex max-w-[560px] flex-col gap-3 rounded-[18px] bg-marinho p-4 text-[13.5px] text-sobre-marinho-claro shadow-2 lg:bottom-5 lg:left-5 lg:right-auto"
    >
      <span>
        Usamos cookies necessários para a loja funcionar e, com a sua permissão, cookies de medição e de
        anúncios.{' '}
        <Link href="/privacidade#cookies" className="text-branco underline hover:text-branco">
          Saiba mais
        </Link>
        .
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          className="btn btn-primary btn-sm min-h-toque"
          onClick={() => escolher('todos')}
        >
          Aceitar todos
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm min-h-toque"
          onClick={() => escolher('necessarios')}
        >
          Só necessários
        </button>
      </div>
    </div>
  );
}
