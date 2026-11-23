'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { NomeIcone } from '@/components/ui/Icone';

export type TelaAcesso = 'entrar' | 'cadastro' | 'lojista-entrar' | 'lojista-cadastro';
export interface ConfigAcesso {
  titulo: string;
  tituloDestaque: string;
  apoio: string;
  tituloFormulario: string;
  apoioFormulario: string;
  destaques: Array<{ icone: NomeIcone; titulo: string; texto: string }>;
  selos: Array<{ icone: NomeIcone; texto: string }>;
  fundo: string;
  corFundo: string;
  corTexto: string;
  corMarca: string;
  corEtiqueta: string;
  corTextoEtiqueta: string;
  corDestaque: string;
  corCartoes: string;
  corFormulario: string;
  corTextoFormulario: string;
  corBotao: string;
  corTextoBotao: string;
  corLinks: string;
  opacidade: number;
  mostrarConteudoMobile: boolean;
  banner: {
    ativo: boolean;
    patrocinado: boolean;
    anunciante: string;
    imagem: string;
    titulo: string;
    descricao: string;
    link: string;
    inicio: string;
    fim: string;
  };
}

interface Estado {
  porCidade: Record<string, Partial<Record<TelaAcesso, ConfigAcesso>>>;
  salvar: (cidade: string, tela: TelaAcesso, valor: ConfigAcesso) => void;
  restaurar: (cidade: string, tela: TelaAcesso) => void;
}

export const useAcessoVisual = create<Estado>()(
  persist(
    (set) => ({
      porCidade: {},
      salvar: (cidade, tela, valor) =>
        set((s) => ({ porCidade: { ...s.porCidade, [cidade]: { ...s.porCidade[cidade], [tela]: valor } } })),
      restaurar: (cidade, tela) =>
        set((s) => {
          const telas = { ...s.porCidade[cidade] };
          delete telas[tela];
          return { porCidade: { ...s.porCidade, [cidade]: telas } };
        }),
    }),
    { name: 'ct-acesso-visual-v1', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export function useConfigAcesso(cidade: string, tela: TelaAcesso) {
  const config = useAcessoVisual((s) => s.porCidade[cidade]?.[tela]);
  useEffect(() => {
    if (!useAcessoVisual.persist.hasHydrated()) void useAcessoVisual.persist.rehydrate();
    const atualizar = (e: StorageEvent) => {
      if (e.key === 'ct-acesso-visual-v1') void useAcessoVisual.persist.rehydrate();
    };
    window.addEventListener('storage', atualizar);
    return () => window.removeEventListener('storage', atualizar);
  }, []);
  return config;
}
