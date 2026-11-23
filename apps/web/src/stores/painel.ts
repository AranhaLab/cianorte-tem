'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { VAGAS } from '@/mocks/anuncios';
import { useAdmin } from './admin';
import { CATALOGO } from '@/mocks/catalogo';
import { PAINEL_DEMO } from '@/mocks/painel';
import { limitarQuantidade, lanceMinimo, UNIDADES, type UnidadeTempo } from '@/lib/regras/anuncios';
import type { LogisticaLoja } from '@/lib/regras/logistica';
import { podeEnviarArte } from '@/lib/regras/arteAnuncio';
import { cadastroVazio, type CadastroLoja } from '@/lib/regras/cadastroLoja';
import { proximoStatus } from '@/lib/regras/pedidos';
import {
  aplicarAprovacao,
  aplicarEdicao,
  rascunhoDeProduto,
  saldoTotal,
  type RascunhoProduto,
} from '@/lib/regras/produto';
import type {
  ArteAnuncio,
  Campanha,
  ModoSincronizacao,
  PainelLojista,
  StatusSubpedido,
  Unidade,
  VagaAnuncio,
  VagaId,
} from '@/types/domain';

/**
 * Estado do painel do lojista — SÓ PARA A DEMONSTRAÇÃO.
 * No back-end cada ação vira uma chamada (CLAUDE.md §11): PATCH /v1/painel/loja,
 * PATCH /v1/painel/pedidos, PUT de estoque, POST /v1/anuncios/lances etc., e a
 * autorização (dono/equipe com permissão) é verificada no servidor.
 */
/** Produto editado no painel: versão publicada (preço/estoque já valendo) e versão em análise. */
export interface EdicaoProduto {
  atual: RascunhoProduto;
  emAnalise: RascunhoProduto | null;
  pendentes: string[]; // campos editoriais aguardando moderação
  novo: boolean;
  /** Motivo da última reprovação da moderação (o lojista vê no editor). */
  reprovacao?: string;
}

interface Persistido extends PainelLojista {
  edicoes: Record<string, EdicaoProduto>;
  /** null = ainda não configurada (usa os dados da loja). */
  logistica: LogisticaLoja | null;
  filiais: Unidade[];
  /** Cadastro da loja (adesão). null = ainda não aberto: o formulário parte dos dados da loja. */
  cadastro: CadastroLoja | null;
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
  /** Salva o cadastro a cada alteração (como um rascunho no servidor). */
  salvarCadastro: (c: CadastroLoja) => void;
  /** Novo lojista (adesão pela página "Quero vender"): começa um cadastro do zero. */
  novoLojista: (dados: {
    fantasia: string;
    cnpj: string;
    nome: string;
    email: string;
    celular: string;
  }) => void;
  avancarPedido: (id: string) => StatusSubpedido | null;
  definirModoSync: (m: ModoSincronizacao) => void;
  definirReserva: (n: number) => void;
  atualizarEstoque: (r: RascunhoProduto, indisponivelManual?: boolean) => void;
  moverModulo: (i: number, d: -1 | 1) => void;
  removerModulo: (i: number) => void;
  adicionarModulo: (tipo: string) => void;
  selecionarVaga: (v: VagaId) => void;
  definirUnidade: (u: UnidadeTempo) => void;
  definirQuantidade: (q: number) => void;
  /** Compra direta pelo valor de tabela: o espaço fica garantido e libera o envio da arte. */
  contratar: () => 'ok' | 'so_lance';
  darLance: (valorDiaCentavos: number) => 'ok' | 'abaixo_do_minimo' | 'so_direta';
  /** Demonstração: fim da disputa. Venceu → libera a arte; senão, lance superado. */
  resultadoLance: (campanhaId: string, venceu: boolean) => void;
  /** Envia a arte (só com o espaço garantido) → arte em análise. */
  enviarArte: (campanhaId: string, arte: ArteAnuncio) => 'ok' | 'sem_espaco';
  /** T1: envia a frase do letreiro (só com o espaço garantido) → em análise. */
  enviarLetreiro: (campanhaId: string, letreiro: { texto: string; destino: string }) => 'ok' | 'sem_espaco';
  /** Moderação da plataforma: aprova (no ar) ou reprova com motivo (lojista pode reenviar). */
  decidirArte: (campanhaId: string, aprovar: boolean, motivo?: string) => void;
  salvarProduto: (
    publicado: RascunhoProduto | null,
    rascunho: RascunhoProduto,
  ) => { id: string; editoriais: string[]; imediatas: string[] };
  aprovarProduto: (id: string) => void;
  reprovarProduto: (id: string, motivo: string) => void;
  reprovarFilial: (id: string) => void;
  salvarLogistica: (l: LogisticaLoja) => void;
  adicionarFilial: (u: Omit<Unidade, 'id' | 'status'>) => void;
  aprovarFilial: (id: string) => void;
}

/** Demonstração: a calça (p2) tem uma descrição nova aguardando a moderação (como no protótipo). */
function edicoesDemo(): Record<string, EdicaoProduto> {
  const p = CATALOGO.cianorte?.produtos.find((x) => x.id === 'p2');
  const est = PAINEL_DEMO.estoque.find((x) => x.produtoId === 'p2');
  if (!p) return {};
  const atual = rascunhoDeProduto(p, est);
  const emAnalise = {
    ...atual,
    descricao: 'Jeans com elastano, cintura alta e lavagem média. Modelagem da casa.',
  };
  return { p2: { atual, emAnalise, pendentes: ['descricao'], novo: false } };
}

const inicial = (): Persistido => ({
  ...structuredClone(PAINEL_DEMO),
  vagas: structuredClone(VAGAS),
  vagaSelecionada: 'H1',
  unidade: 'dias',
  quantidade: 7,
  edicoes: edicoesDemo(),
  logistica: null,
  filiais: [],
  cadastro: null,
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
      salvarCadastro: (cadastro) => set({ cadastro }),
      novoLojista: (d) => {
        const c = cadastroVazio();
        c.empresa.fantasia = d.fantasia;
        c.empresa.cnpj = d.cnpj;
        c.responsavel = { ...c.responsavel, nome: d.nome, email: d.email, celular: d.celular };
        // Loja nova: rascunho, oculta e sem vender até a aprovação (§7.1 e §7.2).
        set({ cadastro: c, status: 'rascunho', visivel: false, responsavel: d.nome });
      },

      avancarPedido: (id) => {
        if (useAdmin.getState().analises[id]) return null; // em análise administrativa
        const p = get().pedidos.find((x) => x.id === id);
        const prox = p && proximoStatus(p.modo, p.status);
        if (!prox) return null;
        set((s) => ({ pedidos: s.pedidos.map((x) => (x.id === id ? { ...x, status: prox } : x)) }));
        return prox;
      },

      definirModoSync: (modo) => set((s) => ({ integracao: { ...s.integracao, modo } })),
      definirReserva: (n) =>
        set((s) => ({ integracao: { ...s.integracao, reservaSeguranca: Math.max(0, Math.floor(n) || 0) } })),
      atualizarEstoque: (r, indisponivelManual) => set((s) => {
        if (!r.id) return {};
        const id = r.id;
        const anterior = s.edicoes[id];
        const atualizar = (destino: RascunhoProduto): RascunhoProduto => ({
          ...destino,
          saldo: r.saldo,
          minimo: r.minimo,
          variacao: destino.variacao && r.variacao ? {
            ...destino.variacao,
            opcoes: destino.variacao.opcoes.map((o) => ({
              ...o, saldo: r.variacao?.opcoes.find((item) => item.sku === o.sku)?.saldo ?? o.saldo,
            })),
          } : destino.variacao,
        });
        const item = { produtoId: id, sku: r.sku, saldo: saldoTotal(r), minimo: r.minimo,
          indisponivelManual: indisponivelManual ?? s.estoque.find((e) => e.produtoId === id)?.indisponivelManual ?? false };
        return {
          estoque: s.estoque.some((e) => e.produtoId === id)
            ? s.estoque.map((e) => e.produtoId === id ? item : e)
            : [...s.estoque, item],
          edicoes: { ...s.edicoes, [id]: anterior
            ? { ...anterior, atual: atualizar(anterior.atual), emAnalise: anterior.emAnalise ? atualizar(anterior.emAnalise) : null }
            : { atual: r, emAnalise: null, pendentes: [], novo: false } },
        };
      }),

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

      contratar: () => {
        const s = get();
        const vaga = s.vagas.find((v) => v.id === s.vagaSelecionada)!;
        if (vaga.modoCompra === 'lance') return 'so_lance';
        // Demonstração: pagamento confirmado na hora. Na versão real, a arte libera após o webhook.
        const c: Campanha = {
          id: crypto.randomUUID(),
          vaga: vaga.id,
          ...(vaga.pagina === 'categoria'
            ? {
                categoriaId: Object.values(CATALOGO)
                  .flatMap((cat) => cat.lojas)
                  .find((l) => l.id === s.lojaId)?.categoriaId,
              }
            : {}),
          status: 'aguardando_arte',
          origem: 'direta',
          valorDiaCentavos: vaga.precoDiaCentavos,
          periodo: `${s.unidade === 'mes' ? '1 mês' : `${s.quantidade} ${UNIDADES[s.unidade].rotulo.toLowerCase()}`} · ${vaga.status === 'ocupado' ? `a partir de ${vaga.ocupadoAte}` : 'a partir da aprovação da arte'}`,
        };
        set({ campanhas: [c, ...s.campanhas] });
        return 'ok';
      },
      darLance: (valor) => {
        const s = get();
        const vaga = s.vagas.find((v) => v.id === s.vagaSelecionada)!;
        if (vaga.modoCompra === 'direta') return 'so_direta';
        if (!(valor >= lanceMinimo(vaga))) return 'abaixo_do_minimo';
        set({
          vagas: s.vagas.map((v) =>
            v.id === vaga.id && v.status === 'leilao'
              ? { ...v, lanceAtualCentavos: valor, lances: v.lances + 1 }
              : v,
          ),
          campanhas: [
            {
              id: crypto.randomUUID(),
              vaga: vaga.id,
              status: 'lance_ativo',
              origem: 'lance',
              valorDiaCentavos: valor,
              periodo: `${s.unidade === 'mes' ? '1 mês' : `${s.quantidade} ${UNIDADES[s.unidade].rotulo.toLowerCase()}`} · ${vaga.status === 'ocupado' ? `a partir de ${vaga.ocupadoAte}` : 'próximo período'}`,
            },
            ...s.campanhas,
          ],
        });
        return 'ok';
      },
      resultadoLance: (id, venceu) =>
        set((s) => ({
          campanhas: s.campanhas.map((c) =>
            c.id === id && c.status === 'lance_ativo'
              ? { ...c, status: venceu ? 'aguardando_arte' : 'lance_superado' }
              : c,
          ),
        })),
      enviarArte: (id, arte) => {
        const c = get().campanhas.find((x) => x.id === id);
        if (!c || !podeEnviarArte(c.status)) return 'sem_espaco';
        set((s) => ({
          campanhas: s.campanhas.map((x) =>
            x.id === id ? { ...x, arte, status: 'arte_em_analise', motivoReprovacao: undefined } : x,
          ),
        }));
        return 'ok';
      },
      enviarLetreiro: (id, letreiro) => {
        const c = get().campanhas.find((x) => x.id === id);
        if (!c || !podeEnviarArte(c.status)) return 'sem_espaco';
        set((s) => ({
          campanhas: s.campanhas.map((x) =>
            x.id === id ? { ...x, letreiro, status: 'arte_em_analise', motivoReprovacao: undefined } : x,
          ),
        }));
        return 'ok';
      },
      decidirArte: (id, aprovar, motivo) =>
        set((s) => ({
          campanhas: s.campanhas.map((x) =>
            x.id === id && x.status === 'arte_em_analise'
              ? {
                  ...x,
                  status: aprovar ? 'no_ar' : 'reprovada',
                  motivoReprovacao: aprovar ? undefined : motivo,
                }
              : x,
          ),
        })),

      salvarProduto: (publicado, rascunho) => {
        if (!publicado) {
          // Produto novo: tudo passa pela moderação antes de aparecer.
          const id = `novo-${Date.now().toString(36)}`;
          const r = { ...rascunho, id };
          set((s) => ({
            edicoes: {
              ...s.edicoes,
              [id]: { atual: r, emAnalise: r, pendentes: ['produto novo'], novo: true },
            },
            estoque: r.tipo === 'kit' || r.tipo === 'digital' ? s.estoque : [
              ...s.estoque, { produtoId: id, sku: r.sku, saldo: saldoTotal(r), minimo: r.minimo },
            ],
          }));
          return { id, editoriais: ['produto novo'], imediatas: [] };
        }
        const id = publicado.id!;
        const novo = get().edicoes[id]?.novo ?? false;
        const e = novo
          ? { editoriais: ['produto novo'], imediatas: [], atual: rascunho, emAnalise: rascunho }
          : aplicarEdicao(publicado, rascunho);
        set((s) => ({
          edicoes: {
            ...s.edicoes,
            [id]: { atual: e.atual, emAnalise: e.emAnalise, pendentes: [...e.editoriais], novo },
          },
          // Estoque muda na hora (CLAUDE.md §7.3 e §8).
          estoque: s.estoque.some((x) => x.produtoId === id)
            ? s.estoque.map((x) =>
                x.produtoId === id ? { ...x, saldo: saldoTotal(rascunho), minimo: rascunho.minimo } : x,
              )
            : rascunho.tipo === 'kit' || rascunho.tipo === 'digital'
              ? s.estoque
              : [
                  ...s.estoque,
                  { produtoId: id, sku: rascunho.sku, saldo: saldoTotal(rascunho), minimo: rascunho.minimo },
                ],
        }));
        return { id, editoriais: [...e.editoriais], imediatas: [...e.imediatas] };
      },
      aprovarProduto: (id) =>
        set((s) => {
          const e = s.edicoes[id];
          if (!e?.emAnalise) return {};
          return {
            edicoes: {
              ...s.edicoes,
              [id]: {
                atual: aplicarAprovacao(e.atual, e.emAnalise),
                emAnalise: null,
                pendentes: [],
                novo: false,
              },
            },
          };
        }),

      reprovarProduto: (id, motivo) =>
        set((s) => {
          const e = s.edicoes[id];
          if (!e?.emAnalise) return {};
          // Reprovado: a versão publicada continua; o conteúdo proposto volta para o lojista corrigir.
          return {
            edicoes: { ...s.edicoes, [id]: { ...e, emAnalise: null, pendentes: [], reprovacao: motivo } },
          };
        }),
      reprovarFilial: (id) =>
        set((s) => ({ filiais: s.filiais.map((f) => (f.id === id ? { ...f, status: 'reprovada' } : f)) })),

      salvarLogistica: (logistica) => set({ logistica }),
      adicionarFilial: (u) =>
        set((s) => ({
          filiais: [...s.filiais, { ...u, id: `u${s.filiais.length + 2}`, status: 'em_analise' }],
        })),
      aprovarFilial: (id) =>
        set((s) => ({ filiais: s.filiais.map((f) => (f.id === id ? { ...f, status: 'aprovada' } : f)) })),
    }),
    {
      name: 'ct-painel-v1',
      // Atualiza a tabela demonstrativa sem descartar campanhas já criadas.
      version: 3,
      migrate: (antigo, versao) => {
        const dados = antigo as Persistido;
        if (versao < 2) return { ...dados, campanhas: inicial().campanhas, vagas: inicial().vagas };
        return {
          ...dados,
          vagas: (dados.vagas ?? inicial().vagas).map((vaga) => {
            const tabela = VAGAS.find((v) => v.id === vaga.id);
            return tabela
              ? {
                  ...vaga,
                  precoDiaCentavos: tabela.precoDiaCentavos,
                  ...(vaga.id === 'L1' ? { status: tabela.status, ocupadoAte: tabela.ocupadoAte } : {}),
                  lanceAtualCentavos:
                    vaga.id === 'H1' && (vaga.lanceAtualCentavos ?? 0) < tabela.precoDiaCentavos
                      ? tabela.precoDiaCentavos
                      : vaga.lanceAtualCentavos,
                }
              : vaga;
          }),
        };
      },
      // A cada carga: vaga criada depois do que está salvo no aparelho (ex.: T1, o letreiro)
      // entra na lista. Sem isto, o mapa de anúncios procurava a vaga nova e quebrava.
      merge: (salvo, atual) => {
        const dados = { ...atual, ...(salvo as Partial<Persistido>) };
        const vagas = dados.vagas ?? VAGAS;
        const faltam = VAGAS.filter((v) => !vagas.some((x) => x.id === v.id));
        const todas = faltam.length ? [...vagas, ...structuredClone(faltam)] : vagas;
        return {
          ...dados,
          vagas: todas,
          vagaSelecionada: todas.some((v) => v.id === dados.vagaSelecionada) ? dados.vagaSelecionada : 'H1',
        };
      },
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
        edicoes: s.edicoes,
        logistica: s.logistica,
        filiais: s.filiais,
        cadastro: s.cadastro,
      }),
      onRehydrateStorage: () => () => usePainel.setState({ hidratado: true }),
    },
  ),
);
