'use client';

import { createContext, useContext, type ReactNode } from 'react';

export const ContextoFormularioAcesso = createContext<{ titulo: string; apoio: string }>({
  titulo: '',
  apoio: '',
});

export function TextoFormularioAcesso({
  campo,
  children,
}: {
  campo: 'titulo' | 'apoio';
  children: ReactNode;
}) {
  return <>{useContext(ContextoFormularioAcesso)[campo] || children}</>;
}
