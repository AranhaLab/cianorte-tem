'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAdmin } from '@/stores/admin';
import { useLogos } from '@/stores/logos';
import { usePainel } from '@/stores/painel';
import type { Categoria, Loja, Produto } from '@/types/domain';
import { useCategorias } from '@/stores/categorias';

/** Dados da loja logada (vêm do servidor) para as telas do painel. */
interface DadosLoja {
  loja: Loja;
  produtos: Produto[];
  categorias: Categoria[];
}

const Ctx = createContext<DadosLoja | null>(null);

export function PainelProvider({ dados, children }: { dados: DadosLoja; children: ReactNode }) {
  const categorias = useCategorias(dados.categorias);
  useEffect(() => {
    void usePainel.persist.rehydrate();
    void useAdmin.persist.rehydrate(); // análises e comissão decididas pela plataforma
    void useLogos.persist.rehydrate();
  }, []);
  return <Ctx.Provider value={{ ...dados, categorias }}>{children}</Ctx.Provider>;
}

/**
 * Loja como aparece no painel: com o nome fantasia do cadastro. Um lojista novo (adesão pela
 * página "Quero vender") não herda a logo da loja de exemplo até enviar a dele.
 */
export function useLojaExibida(): Loja {
  const { loja } = useLojaPainel();
  const fantasia = usePainel((s) => s.cadastro?.empresa.fantasia);
  if (!fantasia || fantasia === loja.nome) return loja;
  return { ...loja, nome: fantasia, logo: undefined };
}

export function useLojaPainel(): DadosLoja {
  const d = useContext(Ctx);
  if (!d) throw new Error('useLojaPainel fora do PainelProvider');
  return d;
}
