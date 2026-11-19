'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { COMISSAO_PADRAO } from '@/lib/regras/admin';
import { CANDIDATAS, FILA_MODERACAO, type Candidata, type ItemModeracao } from '@/mocks/admin';
import type { Selo, StatusCadastroLoja } from '@/types/domain';

/**
 * Administração da plataforma — estado da DEMONSTRAÇÃO.
 * No back-end: rotas /v1/admin/* só para o papel admin, cada decisão em `Auditoria`
 * (quem, quando, o quê, alvo e motivo), sem dados pessoais desnecessários no log.
 */
export interface EntradaAuditoria {
  id: string;
  quando: string; // ISO (UTC)
  quem: string;
  acao: string;
  alvo: string;
  motivo?: string;
}

type Decisao = { status: 'aprovado' | 'reprovado'; motivo?: string; em: string };

interface EstadoAdmin {
  hidratado: boolean;
  candidatas: Array<Candidata & { decisao?: Decisao }>;
  fila: Array<ItemModeracao & { decisao?: Decisao }>;
  /** Situação das lojas já aprovadas (sem entrada = aprovada). */
  statusLojas: Record<string, StatusCadastroLoja>;
  selos: Record<string, Selo>;
  /** Subpedidos em análise administrativa: bloqueiam o avanço (§5.6). */
  analises: Record<string, { motivo: string; desde: string }>;
  comissaoPercentual: number;
  auditoria: EntradaAuditoria[];

  registrar: (acao: string, alvo: string, motivo?: string) => void;
  decidirCandidata: (id: string, aprovar: boolean, motivo?: string) => void;
  decidirItem: (id: string, aprovar: boolean, motivo?: string) => void;
  definirStatusLoja: (lojaId: string, status: StatusCadastroLoja) => void;
  definirSelo: (lojaId: string, selo: Selo) => void;
  colocarEmAnalise: (subpedidoId: string, motivo: string) => void;
  liberarAnalise: (subpedidoId: string) => void;
  definirComissao: (p: number) => void;
}

const QUEM = 'Admin (demonstração)';
const agora = () => new Date().toISOString();

export const useAdmin = create<EstadoAdmin>()(
  persist(
    (set) => ({
      hidratado: false,
      candidatas: structuredClone(CANDIDATAS),
      fila: structuredClone(FILA_MODERACAO),
      statusLojas: {},
      selos: {},
      analises: {},
      comissaoPercentual: COMISSAO_PADRAO,
      auditoria: [
        {
          id: 'a0',
          quando: '2026-11-18T18:00:00.000Z',
          quem: QUEM,
          acao: 'Aprovou cadastro de loja',
          alvo: 'Pet Amigo',
        },
      ],

      registrar: (acao, alvo, motivo) =>
        set((s) => ({
          auditoria: [
            { id: crypto.randomUUID(), quando: agora(), quem: QUEM, acao, alvo, motivo },
            ...s.auditoria,
          ],
        })),
      decidirCandidata: (id, aprovar, motivo) =>
        set((s) => ({
          candidatas: s.candidatas.map((c) =>
            c.id === id
              ? { ...c, decisao: { status: aprovar ? 'aprovado' : 'reprovado', motivo, em: agora() } }
              : c,
          ),
        })),
      decidirItem: (id, aprovar, motivo) =>
        set((s) => ({
          fila: s.fila.map((c) =>
            c.id === id
              ? { ...c, decisao: { status: aprovar ? 'aprovado' : 'reprovado', motivo, em: agora() } }
              : c,
          ),
        })),
      definirStatusLoja: (lojaId, status) =>
        set((s) => ({ statusLojas: { ...s.statusLojas, [lojaId]: status } })),
      definirSelo: (lojaId, selo) => set((s) => ({ selos: { ...s.selos, [lojaId]: selo } })),
      colocarEmAnalise: (id, motivo) =>
        set((s) => ({ analises: { ...s.analises, [id]: { motivo, desde: agora() } } })),
      liberarAnalise: (id) =>
        set((s) => {
          const { [id]: _, ...resto } = s.analises;
          return { analises: resto };
        }),
      definirComissao: (comissaoPercentual) => set({ comissaoPercentual }),
    }),
    {
      name: 'ct-admin-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ hidratado: _h, ...s }) =>
        Object.fromEntries(
          Object.entries(s).filter(([, v]) => typeof v !== 'function'),
        ) as Partial<EstadoAdmin>,
      onRehydrateStorage: () => () => useAdmin.setState({ hidratado: true }),
    },
  ),
);
