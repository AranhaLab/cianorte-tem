'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ComponenteKit,
  Endereco,
  FormaPagamento,
  ItemSacola,
  ModoEntrega,
  Pedido,
  Usuario,
} from '@/types/domain';

/**
 * Estado do comprador no navegador: sacola, favoritos, CEP, escolha de cookies e
 * sessão de DEMONSTRAÇÃO.
 *
 * - A sacola existe sem login (visitante) e é mantida ao entrar/criar conta (CLAUDE.md §5.4).
 *   No back-end: PUT /v1/sacola por sessão anônima, fundida com a do usuário no login.
 * - O localStorage é por origem; como cada cidade tem seu domínio, a sacola de
 *   Cianorte nunca aparece em Maringá.
 * - `usuario` aqui é só para a demo. Na versão real a sessão é um cookie httpOnly
 *   emitido pela API, e o front guarda apenas os dados públicos do perfil.
 */

export type Sheet = 'local' | 'cep' | 'cats' | 'sacola' | null;
export type EscolhaCookies = 'todos' | 'necessarios' | null;
export type EtapaCheckout = 'entrega' | 'pagamento' | 'revisao';

/** Rascunho do checkout (no back-end: POST /v1/checkout/cotacao). */
export interface RascunhoCheckout {
  etapa: EtapaCheckout;
  modos: Record<string, ModoEntrega>; // por loja
  pagamento: FormaPagamento;
}
const CHECKOUT_INICIAL: RascunhoCheckout = { etapa: 'entrega', modos: {}, pagamento: 'pix' };

interface Persistido {
  itens: ItemSacola[];
  favoritos: string[];
  cep: string | null; // null = ainda não informado (usa o CEP padrão da cidade)
  cepConfirmado: boolean;
  cookies: EscolhaCookies;
  usuario: Usuario | null;
  /** Pedidos da DEMO. No back-end: GET /v1/me/pedidos. */
  pedidos: Pedido[];
  checkout: RascunhoCheckout;
  /** Downloads já feitos por 'pedidoId:produtoId' (no back-end: contados no servidor). */
  downloads: Record<string, number>;
}

interface Efemero {
  hidratado: boolean;
  sheet: Sheet;
  ultimoAdicionado: string | null;
  toast: { id: number; texto: string } | null;
}

interface Acoes {
  adicionar: (
    produtoId: string,
    opcao: string | null,
    quantidade: number,
    rotulo: string,
    composicao?: ComponenteKit[],
  ) => void;
  alterarQuantidade: (chave: string, delta: number) => void;
  remover: (chave: string) => void;
  limparSacola: () => void;
  alternarFavorito: (produtoId: string) => boolean;
  definirCep: (cep: string) => void;
  confirmarLocal: () => void;
  escolherCookies: (e: Exclude<EscolhaCookies, null>) => void;
  entrar: (u: Usuario) => void;
  sair: () => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
  salvarEndereco: (e: Endereco) => void;
  atualizarCheckout: (dados: Partial<RascunhoCheckout>) => void;
  registrarPedido: (p: Pedido) => void;
  confirmarPagamento: (pedidoId: string) => void;
  registrarDownload: (pedidoId: string, produtoId: string) => void;
  abrir: (s: Sheet) => void;
  fechar: () => void;
  avisar: (texto: string) => void;
}

export type EstadoComprador = Persistido & Efemero & Acoes;

const QTD_MAX = 10;

export const useComprador = create<EstadoComprador>()(
  persist(
    (set, get) => ({
      itens: [],
      favoritos: [],
      cep: null,
      cepConfirmado: false,
      cookies: null,
      usuario: null,
      pedidos: [],
      checkout: CHECKOUT_INICIAL,
      downloads: {},

      hidratado: false,
      sheet: null,
      ultimoAdicionado: null,
      toast: null,

      adicionar: (produtoId, opcao, quantidade, rotulo, composicao) =>
        set((s) => {
          // Kits abertos com escolhas diferentes viram linhas diferentes na sacola.
          const escolha = composicao
            ? composicao
                .map((c) => c.produtoId)
                .sort()
                .join('+')
            : '';
          const chave = `${produtoId}|${opcao ?? ''}|${escolha}`;
          const existe = s.itens.find((i) => i.chave === chave);
          const itens = existe
            ? s.itens.map((i) =>
                i.chave === chave ? { ...i, quantidade: Math.min(QTD_MAX, i.quantidade + quantidade) } : i,
              )
            : [
                ...s.itens,
                {
                  chave,
                  produtoId,
                  opcao,
                  quantidade: Math.min(QTD_MAX, quantidade),
                  ...(composicao ? { composicao } : {}),
                },
              ];
          return { itens, ultimoAdicionado: rotulo, sheet: 'sacola' };
        }),
      alterarQuantidade: (chave, delta) =>
        set((s) => ({
          itens: s.itens.map((i) =>
            i.chave === chave
              ? { ...i, quantidade: Math.max(1, Math.min(QTD_MAX, i.quantidade + delta)) }
              : i,
          ),
        })),
      remover: (chave) => set((s) => ({ itens: s.itens.filter((i) => i.chave !== chave) })),
      limparSacola: () => set({ itens: [] }),

      alternarFavorito: (produtoId) => {
        const era = get().favoritos.includes(produtoId);
        set((s) => ({
          favoritos: era ? s.favoritos.filter((f) => f !== produtoId) : [...s.favoritos, produtoId],
        }));
        return !era;
      },

      definirCep: (cep) => set({ cep, cepConfirmado: true, sheet: null }),
      confirmarLocal: () => set({ cepConfirmado: true }),
      escolherCookies: (cookies) => set({ cookies }),

      entrar: (usuario) => set({ usuario }),
      sair: () => set({ usuario: null, checkout: CHECKOUT_INICIAL }),
      atualizarUsuario: (dados) => set((s) => (s.usuario ? { usuario: { ...s.usuario, ...dados } } : {})),
      salvarEndereco: (endereco) =>
        set((s) => (s.usuario ? { usuario: { ...s.usuario, endereco }, cep: endereco.cep || s.cep } : {})),
      atualizarCheckout: (dados) => set((s) => ({ checkout: { ...s.checkout, ...dados } })),
      /** Pedido criado: a sacola é esvaziada e o rascunho volta ao início. */
      registrarPedido: (p) =>
        set((s) => ({ pedidos: [p, ...s.pedidos], itens: [], checkout: CHECKOUT_INICIAL })),
      /** Só a DEMO chama isto. No real, a confirmação vem do webhook do provedor (idempotente). */
      registrarDownload: (pedidoId, produtoId) =>
        set((s) => {
          const k = `${pedidoId}:${produtoId}`;
          return { downloads: { ...s.downloads, [k]: (s.downloads[k] ?? 0) + 1 } };
        }),
      confirmarPagamento: (id) =>
        set((s) => ({
          pedidos: s.pedidos.map((p) =>
            p.id === id
              ? {
                  ...p,
                  pago: true,
                  pagoEm: new Date().toISOString(),
                  // Digital: o pagamento libera o arquivo e o subpedido já fica entregue.
                  subpedidos: p.subpedidos.map((sp) => ({
                    ...sp,
                    status: sp.modo === 'digital' ? ('entregue' as const) : ('pagamento_confirmado' as const),
                  })),
                }
              : p,
          ),
        })),

      abrir: (sheet) => set({ sheet, ...(sheet === 'sacola' ? {} : { ultimoAdicionado: null }) }),
      fechar: () =>
        set((s) => ({ sheet: null, cepConfirmado: s.sheet === 'local' ? true : s.cepConfirmado })),
      avisar: (texto) => set({ toast: { id: Date.now(), texto } }),
    }),
    {
      name: 'ct-comprador-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // hidrata no cliente (HidratarComprador) para não divergir do SSR
      partialize: (s): Persistido => ({
        itens: s.itens,
        favoritos: s.favoritos,
        cep: s.cep,
        cepConfirmado: s.cepConfirmado,
        cookies: s.cookies,
        usuario: s.usuario,
        pedidos: s.pedidos,
        checkout: s.checkout,
        downloads: s.downloads,
      }),
      onRehydrateStorage: () => () => useComprador.setState({ hidratado: true }),
    },
  ),
);

export const totalItens = (itens: ItemSacola[]) => itens.reduce((a, i) => a + i.quantidade, 0);
