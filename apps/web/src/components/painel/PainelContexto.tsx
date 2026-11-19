'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { usePainel } from '@/stores/painel';
import type { Categoria, Loja, Produto } from '@/types/domain';

/** Dados da loja logada (vêm do servidor) para as telas do painel. */
interface DadosLoja {
  loja: Loja;
  produtos: Produto[];
  categorias: Categoria[];
}

const Ctx = createContext<DadosLoja | null>(null);

export function PainelProvider({ dados, children }: { dados: DadosLoja; children: ReactNode }) {
  useEffect(() => {
    void usePainel.persist.rehydrate();
  }, []);
  return <Ctx.Provider value={dados}>{children}</Ctx.Provider>;
}

export function useLojaPainel(): DadosLoja {
  const d = useContext(Ctx);
  if (!d) throw new Error('useLojaPainel fora do PainelProvider');
  return d;
}
