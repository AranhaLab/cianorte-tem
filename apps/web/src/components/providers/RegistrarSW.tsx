'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker do PWA. Só em produção (no `next dev` ele atrapalharia
 * o recarregamento) e só em contexto seguro (HTTPS ou localhost).
 */
export function RegistrarSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    if (process.env.NODE_ENV !== 'production') {
      // Um PWA instalado anteriormente na mesma origem pode manter scripts antigos do Next no dev.
      void navigator.serviceWorker
        .getRegistrations()
        .then(async (registros) => {
          await Promise.all(
            registros
              .filter((r) => {
                const worker = r.active ?? r.waiting ?? r.installing;
                return worker && new URL(worker.scriptURL).pathname === '/sw.js';
              })
              .map((r) => r.unregister()),
          );
          if ('caches' in window) {
            const nomes = await caches.keys();
            await Promise.all(
              nomes.filter((nome) => /^ct-v\d+-/.test(nome)).map((nome) => caches.delete(nome)),
            );
          }
        })
        .catch(() => {});
      return;
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* sem PWA: o site segue funcionando normalmente */
    });
  }, []);
  return null;
}
