'use client';

import { useEffect } from 'react';

export default function ErroPagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro ao carregar a página:', error);
  }, [error]);
  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center"
      role="alert"
    >
      <h1>Não foi possível carregar esta página</h1>
      <p>Ocorreu um problema temporário. Tente novamente.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
