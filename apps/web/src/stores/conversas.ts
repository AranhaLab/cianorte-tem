'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CONVERSAS_DEMO } from '@/mocks/conversas';
import type { Conversa, MensagemChat } from '@/types/domain';

/**
 * Chat pós-compra — estado da DEMONSTRAÇÃO, compartilhado entre a tela do
 * comprador e o painel da loja no mesmo navegador (assim dá para ver os dois lados).
 * No back-end: Conversation/Message (CLAUDE.md §10), acesso só para quem participa
 * do subpedido, imagens em armazenamento privado e mensagens em tempo real.
 */
interface EstadoConversas {
  hidratado: boolean;
  conversas: Record<string, Conversa>; // por subpedido
  garantir: (c: Omit<Conversa, 'mensagens' | 'lidaPelaLoja' | 'lidaPeloComprador'>) => void;
  enviar: (subpedidoId: string, m: Omit<MensagemChat, 'id' | 'enviadaEm'>) => void;
  marcarLida: (subpedidoId: string, quem: 'loja' | 'comprador') => void;
}

export const useConversas = create<EstadoConversas>()(
  persist(
    (set) => ({
      hidratado: false,
      conversas: Object.fromEntries(CONVERSAS_DEMO.map((c) => [c.subpedidoId, c])),

      garantir: (c) =>
        set((s) =>
          s.conversas[c.subpedidoId]
            ? {}
            : {
                conversas: {
                  ...s.conversas,
                  [c.subpedidoId]: { ...c, mensagens: [], lidaPelaLoja: 0, lidaPeloComprador: 0 },
                },
              },
        ),

      enviar: (id, m) =>
        set((s) => {
          const c = s.conversas[id];
          if (!c) return {};
          const nova: MensagemChat = { ...m, id: crypto.randomUUID(), enviadaEm: new Date().toISOString() };
          const mensagens = [...c.mensagens, nova];
          return {
            conversas: {
              ...s.conversas,
              [id]: {
                ...c,
                mensagens,
                // Quem envia já leu tudo até a própria mensagem.
                ...(m.autor === 'loja'
                  ? { lidaPelaLoja: mensagens.length }
                  : { lidaPeloComprador: mensagens.length }),
              },
            },
          };
        }),

      marcarLida: (id, quem) =>
        set((s) => {
          const c = s.conversas[id];
          if (!c) return {};
          const campo = quem === 'loja' ? 'lidaPelaLoja' : 'lidaPeloComprador';
          return c[campo] === c.mensagens.length
            ? {}
            : { conversas: { ...s.conversas, [id]: { ...c, [campo]: c.mensagens.length } } };
        }),
    }),
    {
      name: 'ct-conversas-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // A prévia da imagem não vai para o aparelho (pode ter MB); fica só o nome e o tamanho.
      partialize: (s) => ({
        conversas: Object.fromEntries(
          Object.entries(s.conversas).map(([k, c]) => [
            k,
            {
              ...c,
              mensagens: c.mensagens.map((m) =>
                m.imagem ? { ...m, imagem: { ...m.imagem, previa: undefined } } : m,
              ),
            },
          ]),
        ),
      }),
      onRehydrateStorage: () => () => useConversas.setState({ hidratado: true }),
    },
  ),
);

/** Mensagens que um lado ainda não leu. */
export const naoLidas = (c: Conversa, quem: 'loja' | 'comprador') =>
  c.mensagens.length - (quem === 'loja' ? c.lidaPelaLoja : c.lidaPeloComprador);
