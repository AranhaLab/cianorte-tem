'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker do PWA. Só em produção (no `next dev` ele atrapalharia
 * o recarregamento) e só em contexto seguro (HTTPS ou localhost).
 */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || !window.isSecureContext)
      return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* sem PWA: o site segue funcionando normalmente */
    });
  }, []);
  return null;
}
