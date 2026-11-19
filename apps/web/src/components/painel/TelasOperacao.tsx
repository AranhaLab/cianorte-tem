'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { StatusDisponibilidade } from '@/components/ui/Basicos';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import { ArteProduto, capaDe } from '@/components/vitrine/ArteProduto';
import { ResumoAvaliacoes } from '@/components/vitrine/AvaliacoesLoja';
import { MODO_DEMO } from '@/lib/demo';
import { reais } from '@/lib/regras/dinheiro';
import { disponibilidadePublica } from '@/lib/regras/disponibilidade';
import { usePainel } from '@/stores/painel';
import { AguardaPainel, TabelaPedidos, TituloPainel, avisar } from './Comum';
import { useLojaPainel } from './PainelContexto';
import type { Disponibilidade } from '@/types/domain';

const hoje = () =>
  new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  });

/* ---------------- Visão geral (protótipo: vPainel) ---------------- */
export function VisaoGeral() {
  return (
    <AguardaPainel>
      <VisaoGeralConteudo />
    </AguardaPainel>
  );
}

function VisaoGeralConteudo() {
  const tenant = useTenant();
  const { loja, produtos } = useLojaPainel();
  const s = usePainel();
  const aSeparar = s.pedidos.filter(
    (o) => o.status === 'pagamento_confirmado' || o.status === 'em_separacao',
  ).length;
  const baixo = s.estoque.filter((e) => e.saldo <= e.minimo).length;
  const data = hoje();

  const tarefa = (icone: NomeIcone, texto: string, href: string) => (
    <Link
      href={href}
      className="flex min-h-toque items-center gap-2.5 border-t border-solid border-neutro-200 py-2.5 text-grafite hover:text-marinho"
    >
      <Icone nome={icone} />
      <span className="flex-1">{texto}</span>
      <Icone nome="chevR" tamanho="sm" />
    </Link>
  );

  return (
    <>
      <TituloPainel
        titulo="Visão geral"
        apoio={data.charAt(0).toUpperCase() + data.slice(1)}
        acao={
          <Link href="/painel/produtos/novo" className="btn btn-primary">
            <Icone nome="plus" />
            Novo produto
          </Link>
        }
      />
      {s.status !== 'aprovada' ? (
        <div className="banner-info bg-aviso-claro text-aviso-texto">
          <Icone nome="clock" />
          <span>
            <b>Cadastro em análise.</b> Você pode montar produtos e estoque, mas a loja só aparece para os
            compradores depois da aprovação.{' '}
            {MODO_DEMO && (
              <button
                type="button"
                className="btn btn-sm btn-soft"
                onClick={() => {
                  s.simularAprovacao();
                  avisar('Cadastro aprovado (simulação).');
                }}
              >
                Simular aprovação (demo)
              </button>
            )}
          </span>
        </div>
      ) : s.visivel ? (
        <div className="banner-info bg-verde-claro text-verde-texto">
          <Icone nome="check" />
          <span>
            <b>Sua loja está no ar.</b> Compradores de {tenant.nome} já veem seus produtos.
          </span>
        </div>
      ) : (
        <div className="banner-info bg-aviso-claro text-aviso-texto">
          <Icone nome="eye" />
          <span>
            <b>Loja oculta.</b> Ative &quot;Loja visível&quot; no menu para voltar a vender.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <div className="kpi border-marinho bg-marinho text-sobre-marinho">
          <span className="text-[13px]">Vendas hoje</span>
          <span className="kpi-valor text-branco">{reais(30970)}</span>
          <span className="text-xs">2 pedidos pagos</span>
        </div>
        <div className="kpi">
          <span className="text-[13px] text-grafite-2">Pedidos a separar</span>
          <span className="kpi-valor">{aSeparar}</span>
          <span className="text-xs text-grafite-2">Prazo de corte: 15h</span>
        </div>
        <div className="kpi">
          <span className="text-[13px] text-grafite-2">Visitas na vitrine (7 dias)</span>
          <span className="kpi-valor">1.284</span>
          <span className="text-xs text-grafite-2">dado de exemplo</span>
        </div>
        <div className="kpi">
          <span className="text-[13px] text-grafite-2">Estoque baixo</span>
          <span className="kpi-valor">{baixo}</span>
          <span className="text-xs text-grafite-2">itens no mínimo</span>
        </div>
      </div>

      <div className="card flex flex-col gap-2">
        <h2>Avaliações e itens vendidos</h2>
        <ResumoAvaliacoes
          loja={{ ...loja, itensVendidos: produtos.reduce((total, produto) => total + produto.vendidos, 0) }}
          mostrarComentarios
        />
      </div>

      <div className="card flex flex-col">
        <h2 className="mb-3">O que precisa da sua atenção</h2>
        {tarefa('receipt', `${aSeparar} pedidos esperando separação`, '/painel/pedidos')}
        {tarefa('box', `${baixo} produtos com estoque baixo ou zerado`, '/painel/estoque')}
        {tarefa('clock', '1 produto aguardando moderação de conteúdo', '/painel/produtos')}
        {tarefa(
          'gavel',
          'Seu lance na vitrine principal (H1) termina em 2 d 14 h',
          '/painel/anuncios?vaga=H1',
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2>Pedidos recentes</h2>
        <Link href="/painel/pedidos" className="text-[13px]">
          Ver todos
        </Link>
      </div>
      <TabelaPedidos pedidos={s.pedidos.slice(0, 4)} />

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <Icone nome="link" tamanho="lg" />
          <span className="flex flex-col">
            <b>Integração de estoque: {s.integracao.modo === 'api' ? 'ativa' : 'desligada'}</b>
            <span className="text-[13px] text-grafite-2">
              Última sincronização {s.integracao.ultimaSync} · {s.integracao.falhas24h} falhas em 24 h
            </span>
          </span>
        </span>
        <Link href="/painel/estoque" className="btn btn-ghost btn-sm min-h-toque">
          Gerenciar
        </Link>
      </div>
    </>
  );
}

/* ---------------- Pedidos (protótipo: vPedidosLojista) ---------------- */
type FiltroPedidos = 'todos' | 'separar' | 'concluidos';

export function PedidosLojista() {
  const pedidos = usePainel((s) => s.pedidos);
  const [f, setF] = useState<FiltroPedidos>('todos');
  const lista = pedidos.filter((o) =>
    f === 'separar'
      ? ['pagamento_confirmado', 'em_separacao'].includes(o.status)
      : f === 'concluidos'
        ? ['entregue', 'retirado'].includes(o.status)
        : true,
  );
  return (
    <AguardaPainel>
      <TituloPainel
        titulo="Pedidos"
        acao={
          <div className="segmentado" role="group" aria-label="Filtrar pedidos">
            {(
              [
                ['todos', 'Todos'],
                ['separar', 'A separar'],
                ['concluidos', 'Concluídos'],
              ] as const
            ).map(([id, r]) => (
              <button key={id} type="button" aria-pressed={f === id} onClick={() => setF(id)}>
                {r}
              </button>
            ))}
          </div>
        }
      />
      <div className="banner-info bg-azul-nevoa text-azul-escuro">
        <Icone nome="info" />
        <span className="text-[13px]">
          Só pedidos com pagamento confirmado podem avançar. Cada loja avança a sua parte; a plataforma
          acompanha.
        </span>
      </div>
      <TabelaPedidos pedidos={lista} />
    </AguardaPainel>
  );
}

/* ---------------- Produtos (protótipo: vProdutosLojista) ---------------- */
export function ProdutosLojista() {
  return (
    <AguardaPainel>
      <ProdutosConteudo />
    </AguardaPainel>
  );
}

function ProdutosConteudo() {
  const { produtos, categorias } = useLojaPainel();
  const edicoes = usePainel((s) => s.edicoes);
  const estoque = usePainel((s) => s.estoque);
  const reserva = usePainel((s) => s.integracao.reservaSeguranca);
  const cat = (id: string) => categorias.find((c) => c.id === id) ?? categorias[0]!;

  // Catálogo publicado + edições do painel (preço e estoque já valendo) + produtos novos em análise.
  const linhas = [
    ...produtos.map((p) => {
      const e = edicoes[p.id];
      return {
        id: p.id,
        nome: e?.atual.nome ?? p.nome,
        categoriaId: e?.atual.categoriaId ?? p.categoriaId,
        preco: e?.atual.precoCentavos ?? p.precoCentavos,
        opcoes: e ? (e.atual.variacao?.opcoes.length ?? 0) : (p.variacao?.opcoes.length ?? 0),
        capa: (e?.atual.midias[0] ?? p.midias[0])?.variante ?? 0,
        foto: capaDe(e?.atual.midias ?? p.midias),
        disp: p.disponibilidade,
        pendentes: e?.pendentes.length ?? 0,
        novo: false,
        reprovado: !!e?.reprovacao,
      };
    }),
    ...Object.entries(edicoes)
      .filter(([, e]) => e.novo)
      .map(([id, e]) => ({
        id,
        nome: e.atual.nome,
        categoriaId: e.atual.categoriaId,
        preco: e.atual.precoCentavos,
        opcoes: e.atual.variacao?.opcoes.length ?? 0,
        capa: e.atual.midias[0]?.variante ?? 0,
        foto: capaDe(e.atual.midias),
        disp: 'disponivel' as Disponibilidade,
        pendentes: e.pendentes.length,
        novo: true,
        reprovado: !!e.reprovacao,
      })),
  ].map((l) => {
    const est = estoque.find((x) => x.produtoId === l.id);
    return est
      ? {
          ...l,
          disp: disponibilidadePublica({ saldo: est.saldo, reservaSeguranca: reserva, minimo: est.minimo }),
        }
      : l;
  });

  return (
    <>
      <TituloPainel
        titulo="Produtos"
        acao={
          <Link href="/painel/produtos/novo" className="btn btn-primary">
            <Icone nome="plus" />
            Novo produto
          </Link>
        }
      />
      <div
        className="tabela-wrap"
        tabIndex={0}
        role="region"
        aria-label="Tabela (role para os lados no celular)"
      >
        <table className="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Preço</th>
              <th>Disponibilidade</th>
              <th>Moderação</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="flex items-center gap-2.5">
                    <ArteProduto
                      categoria={cat(p.categoriaId)}
                      variante={p.capa}
                      src={p.foto}
                      sizes="44px"
                      className="!aspect-square h-11 w-11 flex-none rounded-[12px]"
                      tamanhoIcone="h-1/2 w-1/2"
                    />
                    <span className="flex flex-col">
                      <b className="font-semibold">{p.nome}</b>
                      <span className="text-xs text-grafite-2">
                        {cat(p.categoriaId).nome}
                        {p.opcoes ? ` · ${p.opcoes} variações` : ''}
                      </span>
                    </span>
                  </span>
                </td>
                <td>{reais(p.preco)}</td>
                <td>
                  <StatusDisponibilidade disp={p.disp} />
                </td>
                <td>
                  {p.reprovado && !p.pendentes ? (
                    <span className="status st-red">Reprovado</span>
                  ) : p.novo ? (
                    <span className="status st-amber">Novo · em análise</span>
                  ) : p.pendentes ? (
                    <span className="status st-amber">Alteração em análise</span>
                  ) : (
                    <span className="status st-green">Publicado</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/painel/produtos/${p.id}`}
                    className="btn btn-sm btn-ghost min-h-toque"
                    aria-label={`Editar ${p.nome}`}
                  >
                    <Icone nome="edit" tamanho="sm" />
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[13px] text-grafite-2">
        Preço e estoque mudam na hora. Nome, fotos e descrição passam por moderação antes de aparecer.
      </span>
    </>
  );
}
