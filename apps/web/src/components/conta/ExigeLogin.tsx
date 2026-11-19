'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { useComprador } from '@/stores/comprador';

/**
 * Protege telas de quem comprou (conta, checkout, pedido). Na demo a sessão é
 * local; com o back-end, a proteção real é o cookie de sessão validado no servidor
 * (middleware + API). Isto só evita mostrar a tela vazia.
 *
 * - Chegou sem login → "Entrar" (com ?next= quando for o checkout).
 * - Estava logado e saiu nesta tela → início (como no protótipo).
 */
export function ExigeLogin({ next, children }: { next?: string; children: ReactNode }) {
  const router = useRouter();
  const hidratado = useComprador((s) => s.hidratado);
  const usuario = useComprador((s) => s.usuario);
  const estavaLogado = useRef(false);

  useEffect(() => {
    if (usuario) estavaLogado.current = true;
    if (!hidratado || usuario) return;
    router.replace(estavaLogado.current ? '/' : next ? `/entrar?next=${next}` : '/entrar');
  }, [hidratado, usuario, router, next]);

  if (!hidratado || !usuario) return <div className="min-h-[50vh]" aria-busy="true" />;
  return children;
}
