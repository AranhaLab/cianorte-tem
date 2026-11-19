'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Logos enviadas pelos lojistas na demonstração (chave `<cidade>:<loja>`).
 * Fica separado do estado do painel: a vitrine só precisa das logos e não deve
 * ler do aparelho pedidos, campanhas e artes do painel a cada página.
 * No back-end: logo por estabelecimento, servida pela API (URL pública otimizada).
 */
interface EstadoLogos {
  logos: Record<string, string>;
  salvarLogo: (tenant: string, lojaId: string, logo: string | null) => void;
}

export const useLogos = create<EstadoLogos>()(
  persist(
    (set) => ({
      logos: {},
      salvarLogo: (tenant, lojaId, logo) =>
        set((s) => {
          const logos = { ...s.logos };
          const chave = `${tenant}:${lojaId}`;
          if (logo) logos[chave] = logo;
          else delete logos[chave];
          return { logos };
        }),
    }),
    {
      name: 'ct-logos-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ logos: s.logos }),
      // Logos salvas antes desta separação ficavam no estado do painel: traz uma vez.
      onRehydrateStorage: () => (estado) => {
        if (!estado || Object.keys(estado.logos).length) return;
        try {
          const antigo = JSON.parse(localStorage.getItem('ct-painel-v1') ?? 'null')?.state?.logos;
          if (antigo && typeof antigo === 'object') useLogos.setState({ logos: antigo });
        } catch {
          /* sem dados antigos */
        }
      },
    },
  ),
);

/** Logo salva da loja na cidade atual, se houver. */
export const useLogoSalva = (tenant: string, lojaId?: string) =>
  useLogos((s) => (lojaId ? s.logos[`${tenant}:${lojaId}`] : undefined));
