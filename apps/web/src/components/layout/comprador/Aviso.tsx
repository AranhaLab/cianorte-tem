'use client';

import { useEffect } from 'react';
import { Icone } from '@/components/ui/Icone';
import { useComprador } from '@/stores/comprador';

/** Aviso flutuante (toast). Some em 2,8 s. Lido por leitores de tela (role=status). */
export function Aviso() {
  const toast = useComprador((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useComprador.setState({ toast: null }), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div role="status" aria-live="polite" className="contents">
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-[calc(110px+env(safe-area-inset-bottom))] left-1/2 z-[80] flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-[14px] bg-grafite px-[18px] py-3 text-sm text-branco shadow-2 lg:bottom-7"
        >
          <Icone nome="check" />
          <span>{toast.texto}</span>
        </div>
      )}
    </div>
  );
}
