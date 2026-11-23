'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useTenant } from '@/components/providers/TenantProvider';
import type { Categoria } from '@/types/domain';

interface EstadoCategorias {
  porCidade: Record<string, Categoria[]>;
  salvar: (cidade: string, categorias: Categoria[]) => void;
}

export const useCategoriasStore = create<EstadoCategorias>()(
  persist(
    (set) => ({
      porCidade: {},
      salvar: (cidade, categorias) => {
        set((s) => ({ porCidade: { ...s.porCidade, [cidade]: categorias } }));
        document.cookie = 'ct-categorias-personalizadas=1; Path=/; Max-Age=31536000; SameSite=Lax';
      },
    }),
    { name: 'ct-categorias-v1', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

/** A lista inicial vem do servidor. Alterações da demonstração ficam no aparelho por cidade. */
export function useCategorias(iniciais: Categoria[]): Categoria[] {
  const tenant = useTenant();
  const salvas = useCategoriasStore((s) => s.porCidade[tenant.slug]);
  useEffect(() => {
    if (!useCategoriasStore.persist.hasHydrated()) void useCategoriasStore.persist.rehydrate();
    const atualizar = (evento: StorageEvent) => {
      if (evento.key === 'ct-categorias-v1') void useCategoriasStore.persist.rehydrate();
    };
    window.addEventListener('storage', atualizar);
    return () => window.removeEventListener('storage', atualizar);
  }, []);
  return salvas ?? iniciais;
}
