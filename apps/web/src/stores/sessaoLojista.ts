'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Sessão do lojista — SÓ DEMONSTRAÇÃO, guardada no aparelho.
 * Na versão real: POST /v1/auth/lojista/entrar devolve cookie httpOnly; o middleware
 * exige a sessão nas rotas /painel e a API confere loja e permissão em cada ação (§4 e §15).
 */
interface SessaoLojista {
  hidratado: boolean;
  lojista: { email: string } | null;
  entrar: (email: string) => void;
  sair: () => void;
}

export const useSessaoLojista = create<SessaoLojista>()(
  persist(
    (set) => ({
      hidratado: false,
      lojista: null,
      entrar: (email) => set({ lojista: { email } }),
      sair: () => set({ lojista: null }),
    }),
    {
      name: 'ct-sessao-lojista-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lojista: s.lojista }),
      onRehydrateStorage: () => () => useSessaoLojista.setState({ hidratado: true }),
    },
  ),
);
