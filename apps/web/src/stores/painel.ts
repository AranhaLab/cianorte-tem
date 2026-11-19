'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { VAGAS } from '@/mocks/anuncios';
import { PAINEL_DEMO } from '@/mocks/painel';
import { limitarQuantidade, lanceMinimo, type UnidadeTempo } from '@/lib/regras/anuncios';
import { proximoStatus } from '@/lib/regras/pedidos';
import type {
  Campanha,
  ModoSincronizacao,
  PainelLojista,
  StatusSubpedido,
  VagaAnuncio,
  VagaId,
} from '@/types/domain';

/**
 * Estado do painel do lojista — SÓ PARA A DEMONSTRAÇÃO.
 * No back-end cada ação vira uma chamada (CLAUDE.md §11): PATCH /v1/painel/loja,
 * PATCH /v1/painel/pedidos, PUT de estoque, POST /v1/anuncios/lances etc., e a
 * autorização (dono/equipe com permissão) é verificada no servidor.
 */
interface Persistido extends PainelLojista {
  vagas: VagaAnuncio[];
  vagaSelecionada: VagaId;
  unidade: UnidadeTempo;
  quantidade: number;
}

interface Acoes {
  hidratado: boolean;
  alternarVisivel: () => 'ok' | 'nao_aprovada';
  simularAprovacao: () => void;
  enviarCadastro: () => void;
  avancarPedido: (id: string) => StatusSubpedido | null;
  definirModoSync: (m: ModoSincronizacao) => void;
  definirReserva: (n: number) => void;
  moverModulo: (i: number, d: -1 | 1) => void;
  removerModulo: (i: number) => void;
  adicionarModulo: (tipo: string) => void;
  selecionarVaga: (v: VagaId) => void;
  definirUnidade: (u: UnidadeTempo) => void;
  definirQuantidade: (q: number) => void;
  contratar: () => void;
  darLance: (valorDiaCentavos: number) => 'ok' | 'abaixo_do_minimo';
}

const inicial = (): Persistido => ({
  ...structuredClone(PAINEL_DEMO),
  vagas: structuredClone(VAGAS),
  vagaSelecionada: 'H1',
  unidade: 'dias',
  quantidade: 7,
});

export const usePainel = create<Persistido & Acoes>()(
  persist(
    (set, get) => ({
      ...inicial(),
      hidratado: false,

      alternarVisivel: () => {
        if (get().status !== 'aprovada') return 'nao_aprovada'; // só loja aprovada fica visível (CLAUDE.md §7.2)
        set((s) => ({ visivel: !s.visivel }));
        return 'ok';
      },
      simularAprovacao: () => set({ status: 'aprovada' }),
      enviarCadastro: () => set((s) => (s.status === 'aprovada' ? {} : { status: 'em_analise' })),

      avancarPedido: (id) => {
        const p = get().pedidos.find((x) => x.id === id);
        const prox = p && proximoStatus(p.modo, p.status);
        if (!prox) return null;
        set((s) => ({ pedidos: s.pedidos.map((x) => (x.id === id ? { ...x, status: prox } : x)) }));
        return prox;
      },

      definirModoSync: (modo) => set((s) => ({ integracao: { ...s.integracao, modo } })),
      definirReserva: (n) =>
        set((s) => ({ integracao: { ...s.integracao, reservaSeguranca: Math.max(0, Math.floor(n) || 0) } })),

      moverModulo: (i, d) =>
        set((s) => {
          const v = [...s.vitrine];
          const j = i + d;
          if (j < 0 || j >= v.length) return {};
          [v[i], v[j]] = [v[j]!, v[i]!];
          return { vitrine: v };
        }),
      removerModulo: (i) => set((s) => ({ vitrine: s.vitrine.filter((_, k) => k !== i) })),
      adicionarModulo: (tipo) =>
        set((s) => ({ vitrine: [...s.vitrine, { tipo, detalhe: 'Configure o conteúdo' }] })),

      selecionarVaga: (vagaSelecionada) => set({ vagaSelecionada }),
      definirUnidade: (unidade) =>
        set((s) => ({ unidade, quantidade: limitarQuantidade(unidade, s.quantidade) })),
      definirQuantidade: (q) => set((s) => ({ quantidade: limitarQuantidade(s.unidade, q) })),

      contratar: () =>
        set((s) => {
          const vaga = s.vagas.find((v) => v.id === s.vagaSelecionada)!;
          const c: Campanha = {
            vaga: vaga.id,
            status: 'Arte em análise',
            valorDiaCentavos: vaga.precoDiaCentavos,
            periodo: 'A partir da aprovação',
          };
          return { campanhas: [c, ...s.campanhas] };
        }),
      darLance: (valor) => {
        const s = get();
        const vaga = s.vagas.find((v) => v.id === s.vagaSelecionada)!;
        if (!(valor >= lanceMinimo(vaga))) return 'abaixo_do_minimo';
        set({
          vagas: s.vagas.map((v) =>
            v.id === vaga.id && v.status === 'leilao'
              ? { ...v, lanceAtualCentavos: valor, lances: v.lances + 1 }
              : v,
          ),
          campanhas: [
            {
              vaga: vaga.id,
              status: 'Lance vencendo',
              valorDiaCentavos: valor,
              periodo: vaga.status === 'ocupado' ? `A partir de ${vaga.ocupadoAte}` : 'Próximo período',
            },
            ...s.campanhas,
          ],
        });
        return 'ok';
      },
    }),
    {
      name: 'ct-painel-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Só os dados; ações e o sinal de hidratação não vão para o aparelho.
      partialize: (s): Persistido => ({
        lojaId: s.lojaId,
        status: s.status,
        visivel: s.visivel,
        responsavel: s.responsavel,
        integracao: s.integracao,
        pedidos: s.pedidos,
        estoque: s.estoque,
        campanhas: s.campanhas,
        vitrine: s.vitrine,
        equipe: s.equipe,
        vagas: s.vagas,
        vagaSelecionada: s.vagaSelecionada,
        unidade: s.unidade,
        quantidade: s.quantidade,
      }),
      onRehydrateStorage: () => () => usePainel.setState({ hidratado: true }),
    },
  ),
);
