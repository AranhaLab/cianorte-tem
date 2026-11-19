'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useComprador } from '@/stores/comprador';

/** Páginas onde o modal "Onde você quer receber?" não abre sozinho. */
const SEM_MODAL_LOCAL = ['/termos', '/privacidade'];

/**
 * Lê o estado salvo no aparelho depois da primeira renderização (evita divergência
 * com o HTML do servidor) e, na primeira visita, abre o modal de localização sem
 * bloquear a navegação (CLAUDE.md §16).
 */
export function Hidratar() {
  const path = usePathname();
  useEffect(() => {
    void useComprador.persist.rehydrate();
  }, []);

  const hidratado = useComprador((s) => s.hidratado);
  const cepConfirmado = useComprador((s) => s.cepConfirmado);
  useEffect(() => {
    if (
      hidratado &&
      !cepConfirmado &&
      !SEM_MODAL_LOCAL.some((p) => path.startsWith(p)) &&
      !useComprador.getState().sheet
    )
      useComprador.getState().abrir('local');
  }, [hidratado, cepConfirmado, path]);

  // Ao trocar de página, fecha modais e sacola lateral (como no protótipo), mas não o de localização.
  useEffect(() => {
    const s = useComprador.getState();
    if (s.sheet && s.sheet !== 'local') useComprador.setState({ sheet: null });
  }, [path]);

  return null;
}
