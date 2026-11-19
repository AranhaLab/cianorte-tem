'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { ArteProduto } from '@/components/vitrine/ArteProduto';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { cadastroCompleto, podeSerOficial, repasse, situacaoIndicada } from '@/lib/regras/admin';
import { reais } from '@/lib/regras/dinheiro';
import { rotuloCampo } from '@/lib/regras/produto';
import { LOJAS_INFO, PEDIDOS_GLOBAIS, type DocumentosLoja } from '@/mocks/admin';
import { useAdmin } from '@/stores/admin';
import { PreviaAnuncio } from '@/components/anuncios/PreviaAnuncio';
import { criativoDaArte } from '@/lib/regras/arteAnuncio';
import { usePainel } from '@/stores/painel';
import type { StatusCadastroLoja } from '@/types/domain';
import {
  AcaoComMotivo,
  AguardaAdmin,
  AvisoDemo,
  avisar,
  dataHora,
  definirStatusLoja,
  docsDe,
  Kpi,
  TituloAdmin,
  useDadosAdmin,
  usePendencias,
  useSituacaoLojas,
} from './Comum';

const registrar = (acao: string, alvo: string, motivo?: string) =>
  useAdmin.getState().registrar(acao, alvo, motivo);

const STATUS: Record<StatusCadastroLoja, [string, string]> = {
  rascunho: ['Rascunho', 'st-gray'],
  em_analise: ['Em análise', 'st-amber'],
  aprovada: ['Ativa', 'st-green'],
  reprovada: ['Reprovada', 'st-red'],
  suspensa: ['Suspensa', 'st-red'],
};

/* ---------------- Visão geral ---------------- */
export function VisaoGeralAdmin() {
  return (
    <AguardaAdmin>
      <VisaoGeralConteudo />
    </AguardaAdmin>
  );
}

function VisaoGeralConteudo() {
  const { lojas } = useDadosAdmin();
  const comissao = useAdmin((s) => s.comissaoPercentual);
  const sit = useSituacaoLojas();
  const p = usePendencias();
  const pagos = PEDIDOS_GLOBAIS.filter((x) => x.pagamento === 'confirmado' && x.status !== 'cancelado');
  const gmv = pagos.reduce((a, x) => a + x.produtosCentavos + x.freteCentavos, 0);
  const receita = pagos.reduce((a, x) => a + repasse(x, comissao).comissao, 0);
  const ativas = lojas.filter((l) => sit.status(l.id) === 'aprovada').length;

  const pendencias: Array<[number, string, string]> = [
    [p.cadastros, 'cadastros de loja aguardando análise', '/admin/lojas'],
    [p.filiais, 'filiais aguardando análise', '/admin/lojas?aba=filiais'],
    [p.produtos, 'produtos e alterações para moderar', '/admin/moderacao'],
    [p.pedidos, 'pedidos em análise administrativa', '/admin/pedidos?f=analise'],
  ];

  return (
    <>
      <TituloAdmin titulo="Visão geral" apoio="Últimos 7 dias · valores da demonstração" />
      <AvisoDemo />
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <Kpi rotulo="Vendas pagas (com frete)" valor={reais(gmv)} />
        <Kpi rotulo={`Comissão (${comissao}% sobre produtos)`} valor={reais(receita)} />
        <Kpi rotulo="Lojas ativas" valor={String(ativas)} />
        <Kpi rotulo="Pedidos pagos" valor={String(pagos.length)} destaque />
      </div>
      <section className="card flex flex-col gap-2" aria-label="Pendências">
        <h2>Pendências</h2>
        {pendencias.every(([n]) => n === 0) ? (
          <span className="text-sm text-grafite-2">Nada pendente. Tudo em dia.</span>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {pendencias
              .filter(([n]) => n > 0)
              .map(([n, texto, href]) => (
                <li key={href} className="border-t border-solid border-borda first:border-0">
                  <Link
                    href={href}
                    className="flex min-h-toque items-center gap-3 py-2 text-grafite hover:text-marinho"
                  >
                    <span className="rounded-full bg-acento px-2.5 py-0.5 text-sm font-bold text-branco">
                      {n}
                    </span>
                    <span className="flex-1 text-sm">{texto}</span>
                    <Icone nome="chevR" tamanho="sm" />
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* ---------------- Lojas, cadastros, filiais e selos ---------------- */
type Aba = 'cadastros' | 'lojas' | 'filiais';

export function LojasAdmin({ aba: abaInicial }: { aba?: string }) {
  const [aba, setAba] = useState<Aba>(
    abaInicial === 'lojas' || abaInicial === 'filiais' ? abaInicial : 'cadastros',
  );
  const p = usePendencias();
  return (
    <AguardaAdmin>
      <TituloAdmin
        titulo="Lojas e filiais"
        apoio="Cada empresa e cada unidade têm cadastro e aprovação próprios. Unidade não aprovada não vende."
      />
      <div className="segmentado self-start" role="group" aria-label="Seção">
        {(
          [
            ['cadastros', `Cadastros (${p.cadastros})`],
            ['lojas', 'Lojas'],
            ['filiais', `Filiais (${p.filiais})`],
          ] as const
        ).map(([id, nome]) => (
          <button key={id} type="button" aria-pressed={aba === id} onClick={() => setAba(id)}>
            {nome}
          </button>
        ))}
      </div>
      {aba === 'cadastros' && <Cadastros />}
      {aba === 'lojas' && <TabelaLojas />}
      {aba === 'filiais' && <Filiais />}
    </AguardaAdmin>
  );
}

function ListaDocs({ d }: { d: DocumentosLoja }) {
  const itens: Array<[keyof DocumentosLoja, string]> = [
    ['cartaoCnpj', 'Cartão CNPJ (obrigatório)'],
    ['contratoAceito', 'Contrato do Lojista aceito (obrigatório)'],
    ['contratoSocial', 'Contrato social'],
    ['registroMarca', 'Registro de marca'],
  ];
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]" aria-label="Documentos">
      {itens.map(([k, nome]) => (
        <li key={k} className={`flex items-center gap-1.5 ${d[k] ? 'text-verde-texto' : 'text-grafite-2'}`}>
          <Icone nome={d[k] ? 'check' : 'x'} tamanho="sm" />
          {nome}
          <span className="sr-only">{d[k] ? ': enviado' : ': não enviado'}</span>
        </li>
      ))}
    </ul>
  );
}

function Cadastros() {
  const candidatas = useAdmin((s) => s.candidatas);
  const status = usePainel((s) => s.status);
  const { lojas } = useDadosAdmin();
  const lojaDemo = lojas.find((l) => l.id === usePainel.getState().lojaId);
  const pendentes = candidatas.filter((c) => !c.decisao);
  const decididas = candidatas.filter((c) => c.decisao);

  const decidir = (id: string, nome: string, aprovar: boolean, motivo?: string) => {
    useAdmin.getState().decidirCandidata(id, aprovar, motivo);
    registrar(aprovar ? 'Aprovou cadastro de loja' : 'Reprovou cadastro de loja', nome, motivo);
    avisar(aprovar ? `${nome} aprovada. O lojista já pode ligar a loja.` : `${nome} reprovada.`);
  };

  if (!pendentes.length && status !== 'em_analise' && !decididas.length)
    return (
      <CaixaVazia icone="store" titulo="Nenhum cadastro" texto="Novos pedidos de adesão aparecem aqui." />
    );

  return (
    <div className="flex flex-col gap-3">
      {status === 'em_analise' && lojaDemo && (
        <article className="card flex flex-col gap-3" aria-label={`Cadastro de ${lojaDemo.nome}`}>
          <div className="flex flex-wrap items-center gap-3">
            <AvatarLoja loja={lojaDemo} className="h-11 w-11 rounded-[12px] text-sm" />
            <span className="flex flex-1 flex-col">
              <b>{lojaDemo.nome}</b>
              <span className="text-xs text-grafite-2">
                CNPJ {lojaDemo.cnpj} · reenviou o cadastro pelo painel (loja da demonstração)
              </span>
            </span>
            <span className="status st-amber">Em análise</span>
          </div>
          <ListaDocs d={docsDe(lojaDemo.id)} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                definirStatusLoja(lojaDemo.id, 'aprovada');
                registrar('Aprovou cadastro de loja', lojaDemo.nome);
                avisar(`${lojaDemo.nome} aprovada.`);
              }}
            >
              Aprovar
            </button>
            <AcaoComMotivo
              rotulo="Reprovar"
              confirmar="Confirmar reprovação"
              perigo
              ajuda="o lojista vê este texto"
              onConfirmar={(m) => {
                definirStatusLoja(lojaDemo.id, 'reprovada');
                registrar('Reprovou cadastro de loja', lojaDemo.nome, m);
                avisar(`${lojaDemo.nome} reprovada.`);
              }}
            />
          </div>
        </article>
      )}
      {pendentes.map((c) => {
        const completo = cadastroCompleto(c.documentos);
        return (
          <article key={c.id} className="card flex flex-col gap-3" aria-label={`Cadastro de ${c.nome}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex flex-1 flex-col">
                <b>{c.nome}</b>
                <span className="text-xs text-grafite-2">
                  CNPJ {c.cnpj} · {c.categoria} · {c.bairro} · enviado em {dataHora(c.enviadoEm)}
                </span>
              </span>
              <span className="status st-amber">Em análise</span>
            </div>
            <ListaDocs d={c.documentos} />
            {!completo && (
              <span className="erro-campo">Falta o cartão CNPJ: o cadastro não pode ser aprovado assim.</span>
            )}
            {completo && !podeSerOficial(c.documentos) && (
              <span className="text-[13px] text-grafite-2">
                Sem contrato social e registro de marca: entra sem o selo Loja oficial.
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!completo}
                onClick={() => decidir(c.id, c.nome, true)}
              >
                Aprovar
              </button>
              <AcaoComMotivo
                rotulo="Reprovar"
                confirmar="Confirmar reprovação"
                perigo
                ajuda="o lojista vê este texto"
                onConfirmar={(m) => decidir(c.id, c.nome, false, m)}
              />
            </div>
          </article>
        );
      })}
      {decididas.length > 0 && (
        <section className="card flex flex-col gap-1.5" aria-label="Decididos">
          <h2 className="text-base">Decididos</h2>
          {decididas.map((c) => (
            <span key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
              <b>{c.nome}</b>
              <span className={`status ${c.decisao!.status === 'aprovado' ? 'st-green' : 'st-red'}`}>
                {c.decisao!.status === 'aprovado' ? 'Aprovada' : 'Reprovada'}
              </span>
              {c.decisao!.motivo && <span className="text-xs text-grafite-2">{c.decisao!.motivo}</span>}
            </span>
          ))}
        </section>
      )}
    </div>
  );
}

function TabelaLojas() {
  const { lojas } = useDadosAdmin();
  const sit = useSituacaoLojas();
  if (!lojas.length)
    return (
      <CaixaVazia icone="store" titulo="Nenhuma loja" texto="Ainda não há lojas aprovadas nesta cidade." />
    );

  return (
    <div className="flex flex-col gap-3">
      {lojas.map((l) => {
        const st = sit.status(l.id);
        const selo = sit.selo(l);
        const info = LOJAS_INFO[l.id];
        const docs = docsDe(l.id);
        const indicada = info
          ? situacaoIndicada({
              maiorDia: info.maiorDia,
              mediaDiaria6m: info.mediaDiaria6m,
              indicada: selo === 'indicada',
            })
          : 'nao_elegivel';
        return (
          <article key={l.id} className="card flex flex-col gap-3" aria-label={l.nome}>
            <div className="flex flex-wrap items-center gap-3">
              <AvatarLoja loja={l} className="h-11 w-11 rounded-[12px] text-sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <b>{l.nome}</b>
                <span className="text-xs text-grafite-2">
                  CNPJ {l.cnpj} · {l.bairro}
                  {info
                    ? ` · maior dia: ${info.maiorDia} pedidos · média 6 meses: ${info.mediaDiaria6m}/dia`
                    : ''}
                </span>
              </span>
              {selo && (
                <span className={`pill ${selo === 'oficial' ? 'pill-oficial' : 'pill-indicada'}`}>
                  {selo === 'oficial' ? 'Loja oficial' : 'Indicada'}
                </span>
              )}
              <span className={`status ${STATUS[st][1]}`}>{STATUS[st][0]}</span>
            </div>
            <span className="text-[13px] text-grafite-2">
              Indicada (automático):{' '}
              {
                {
                  conquista: 'atingiu 100 pedidos em um dia — recebe o selo na próxima apuração.',
                  nao_elegivel: 'ainda não atingiu 100 pedidos em um dia.',
                  mantem: 'mantém o selo (média ≥ 100 por dia em 6 meses).',
                  perde_na_revisao: 'perde o selo na revisão semestral (média abaixo de 100 por dia).',
                }[indicada]
              }
            </span>
            <div className="flex flex-wrap items-start gap-2">
              {st === 'aprovada' ? (
                <AcaoComMotivo
                  rotulo="Suspender loja"
                  confirmar="Confirmar suspensão"
                  perigo
                  ajuda="a vitrine some; pedidos em andamento continuam"
                  onConfirmar={(m) => {
                    definirStatusLoja(l.id, 'suspensa');
                    registrar('Suspendeu loja', l.nome, m);
                    avisar(`${l.nome} suspensa.`);
                  }}
                />
              ) : st === 'suspensa' ? (
                <AcaoComMotivo
                  rotulo="Reativar loja"
                  confirmar="Confirmar reativação"
                  onConfirmar={(m) => {
                    definirStatusLoja(l.id, 'aprovada');
                    registrar('Reativou loja', l.nome, m);
                    avisar(`${l.nome} reativada.`);
                  }}
                />
              ) : null}
              {selo === 'oficial' ? (
                <AcaoComMotivo
                  rotulo="Revogar Loja oficial"
                  confirmar="Confirmar revogação"
                  perigo
                  ajuda="a vitrine personalizada volta ao padrão"
                  onConfirmar={(m) => {
                    useAdmin.getState().definirSelo(l.id, null);
                    registrar('Revogou selo Loja oficial', l.nome, m);
                    avisar(`Selo revogado de ${l.nome}.`);
                  }}
                />
              ) : selo !== 'indicada' ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={!podeSerOficial(docs)}
                  title={podeSerOficial(docs) ? undefined : 'Faltam contrato social ou registro de marca'}
                  onClick={() => {
                    useAdmin.getState().definirSelo(l.id, 'oficial');
                    registrar('Concedeu selo Loja oficial', l.nome);
                    avisar(`${l.nome} agora é Loja oficial.`);
                  }}
                >
                  Conceder Loja oficial
                </button>
              ) : null}
              {selo !== 'oficial' && !podeSerOficial(docs) && (
                <span className="self-center text-xs text-grafite-2">
                  Loja oficial exige registro de marca, cartão CNPJ e contrato social.
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Filiais() {
  const filiais = usePainel((s) => s.filiais);
  const { lojas } = useDadosAdmin();
  const dona = lojas.find((l) => l.id === usePainel.getState().lojaId);
  if (!filiais.length)
    return (
      <CaixaVazia
        icone="store"
        titulo="Nenhuma filial enviada"
        texto="Quando um lojista adicionar uma unidade em Minha loja, ela aparece aqui para análise."
      />
    );
  return (
    <div className="flex flex-col gap-3">
      {filiais.map((f) => (
        <article key={f.id} className="card flex flex-col gap-3" aria-label={`Filial ${f.nome}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex flex-1 flex-col">
              <b>{f.nome}</b>
              <span className="text-xs text-grafite-2">
                {dona?.nome} · {f.endereco} · {f.bairro} · CEP {f.cep} · {f.horario}
              </span>
            </span>
            <span className={`status ${STATUS[f.status][1]}`}>
              {f.status === 'aprovada' ? 'Aprovada' : STATUS[f.status][0]}
            </span>
          </div>
          {f.status === 'em_analise' && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  usePainel.getState().aprovarFilial(f.id);
                  registrar('Aprovou filial', `${f.nome} (${dona?.nome ?? ''})`);
                  avisar(`${f.nome} aprovada. Já pode vender.`);
                }}
              >
                Aprovar
              </button>
              <AcaoComMotivo
                rotulo="Reprovar"
                confirmar="Confirmar reprovação"
                perigo
                onConfirmar={(m) => {
                  usePainel.getState().reprovarFilial(f.id);
                  registrar('Reprovou filial', `${f.nome} (${dona?.nome ?? ''})`, m);
                  avisar(`${f.nome} reprovada.`);
                }}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

/* ---------------- Moderação de produtos ---------------- */
export function ModeracaoAdmin() {
  return (
    <AguardaAdmin>
      <ModeracaoConteudo />
    </AguardaAdmin>
  );
}

interface ItemFila {
  chave: string;
  loja: string;
  produto: string;
  categoriaId: string;
  tipo: 'novo' | 'alteracao';
  campos: string[];
  nomeNovo?: string;
  descricao: string;
  precoCentavos: number;
  midias: Array<{ tipo: 'imagem' | 'video'; variante: number; legenda?: string; url?: string }>;
  aprovar: () => void;
  reprovar: (motivo: string) => void;
}

function ModeracaoConteudo() {
  const { lojas, categorias } = useDadosAdmin();
  const fila = useAdmin((s) => s.fila);
  const edicoes = usePainel((s) => s.edicoes);
  const lojaDemo = usePainel((s) => s.lojaId);
  const nomeLoja = (id: string) => lojas.find((l) => l.id === id)?.nome ?? id;

  const itens: ItemFila[] = [
    // O que o lojista da demo enviou pelo editor (mesmo navegador).
    ...Object.entries(edicoes)
      .filter(([, e]) => e.emAnalise)
      .map(([id, e]): ItemFila => {
        const r = e.emAnalise!;
        return {
          chave: id,
          loja: nomeLoja(lojaDemo),
          produto: e.novo ? r.nome : e.atual.nome,
          categoriaId: r.categoriaId,
          tipo: e.novo ? 'novo' : 'alteracao',
          campos: e.pendentes,
          nomeNovo: !e.novo && r.nome !== e.atual.nome ? r.nome : undefined,
          descricao: r.descricao,
          precoCentavos: e.atual.precoCentavos,
          midias: r.midias,
          aprovar: () => usePainel.getState().aprovarProduto(id),
          reprovar: (m) => usePainel.getState().reprovarProduto(id, m),
        };
      }),
    ...fila
      .filter((c) => !c.decisao)
      .map((c): ItemFila => ({
        chave: c.id,
        loja: nomeLoja(c.lojaId),
        produto: c.produto,
        categoriaId: c.categoriaId,
        tipo: c.tipo,
        campos: c.campos,
        nomeNovo: c.nomeNovo,
        descricao: c.descricao,
        precoCentavos: c.precoCentavos,
        midias: c.midias,
        aprovar: () => useAdmin.getState().decidirItem(c.id, true),
        reprovar: (m) => useAdmin.getState().decidirItem(c.id, false, m),
      })),
  ];

  return (
    <>
      <TituloAdmin
        titulo="Moderação"
        apoio="Artes de anúncio, produtos novos e mudanças de nome, fotos, descrição ou categoria. Preço e estoque não passam por aqui."
      />
      <ArtesEmAnalise />
      <h2>Produtos</h2>
      {!itens.length ? (
        <CaixaVazia icone="check" titulo="Fila vazia" texto="Nenhum produto aguardando moderação." />
      ) : (
        itens.map((it) => {
          const cat = categorias.find((c) => c.id === it.categoriaId) ?? categorias[0]!;
          return (
            <article
              key={it.chave}
              className="card flex flex-col gap-3"
              aria-label={`Moderação: ${it.produto}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <b>{it.produto}</b>
                  <span className="text-xs text-grafite-2">
                    {it.loja} · {cat.nome} · {reais(it.precoCentavos)}
                  </span>
                </span>
                <span className={`status ${it.tipo === 'novo' ? 'st-blue' : 'st-amber'}`}>
                  {it.tipo === 'novo' ? 'Produto novo' : 'Alteração'}
                </span>
              </div>
              {it.tipo === 'alteracao' && (
                <span className="text-[13px] text-grafite-2">
                  Mudou: <b className="text-marinho">{it.campos.map(rotuloCampo).join(', ')}</b>
                </span>
              )}
              {it.nomeNovo && (
                <div className="legal-box flex flex-col gap-0.5 text-[13px]">
                  <span>
                    Nome atual: <b>{it.produto}</b>
                  </span>
                  <span>
                    Nome proposto: <b>{it.nomeNovo}</b>
                  </span>
                </div>
              )}
              {it.descricao && <p className="m-0 text-sm text-grafite">{it.descricao}</p>}
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Prévia das mídias">
                {it.midias.map((m, i) => (
                  <li key={i} className="relative flex-none">
                    <ArteProduto
                      categoria={cat}
                      variante={m.variante}
                      src={m.tipo === 'imagem' ? m.url : undefined}
                      sizes="80px"
                      className="!aspect-square h-20 w-20 rounded-[10px]"
                      tamanhoIcone="h-1/2 w-1/2"
                    />
                    <span className="absolute left-1 top-1 rounded-full bg-marinho px-1.5 text-[10px] font-bold text-branco">
                      {i + 1}
                      {m.tipo === 'video' ? ' · Vídeo' : ''}
                    </span>
                    <span className="sr-only">{m.legenda ?? (m.tipo === 'video' ? 'Vídeo' : 'Foto')}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-start gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    it.aprovar();
                    registrar(
                      it.tipo === 'novo' ? 'Aprovou produto novo' : 'Aprovou alteração de produto',
                      `${it.produto} (${it.loja})`,
                    );
                    avisar('Aprovado. Já aparece na vitrine.');
                  }}
                >
                  Aprovar
                </button>
                <AcaoComMotivo
                  rotulo="Reprovar"
                  confirmar="Confirmar reprovação"
                  perigo
                  ajuda="o lojista vê este texto"
                  onConfirmar={(m) => {
                    it.reprovar(m);
                    registrar(
                      it.tipo === 'novo' ? 'Reprovou produto novo' : 'Reprovou alteração de produto',
                      `${it.produto} (${it.loja})`,
                      m,
                    );
                    avisar('Reprovado. A versão publicada continua no ar.');
                  }}
                />
              </div>
            </article>
          );
        })
      )}
    </>
  );
}

/**
 * Artes de anúncio aguardando moderação (CLAUDE.md §6 e §9): a prévia usa o mesmo
 * componente da vitrine. Aprovar põe no ar; reprovar exige motivo e o lojista pode reenviar
 * (sem reenvio antes do início do período, o valor é reembolsado).
 */
function ArtesEmAnalise() {
  const campanhas = usePainel((s) => s.campanhas);
  const vagas = usePainel((s) => s.vagas);
  const lojaId = usePainel((s) => s.lojaId);
  const { lojas } = useDadosAdmin();
  const loja = lojas.find((l) => l.id === lojaId);
  const emAnalise = campanhas.filter((c) => c.status === 'arte_em_analise' && c.arte);

  return (
    <section className="flex flex-col gap-3" aria-label="Artes de anúncio">
      <h2>Artes de anúncio</h2>
      {!emAnalise.length || !loja ? (
        <span className="text-sm text-grafite-2">Nenhuma arte aguardando moderação.</span>
      ) : (
        emAnalise.map((c) => {
          const vaga = vagas.find((v) => v.id === c.vaga);
          const criativo = criativoDaArte(c.arte!, c.vaga, {
            nome: loja.nome,
            cor: loja.cor,
            id: loja.id,
            logo: loja.logo,
          });
          const alvo = `${c.vaga} · ${loja.nome}`;
          return (
            <article
              key={c.id}
              className="card flex flex-col gap-3"
              aria-label={`Arte ${c.vaga} de ${loja.nome}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <b>
                    {c.vaga} · {vaga?.nome}
                  </b>
                  <span className="text-xs text-grafite-2">
                    {loja.nome} · {c.periodo} · {c.origem === 'lance' ? 'lance vencido' : 'compra direta'}
                  </span>
                </span>
                <span className="status st-amber">Arte em análise</span>
              </div>
              <PreviaAnuncio criativo={criativo} />
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-grafite-2">
                <li>✓ Selo &quot;Patrocinado&quot; com logo e nome da loja (automático)</li>
                <li>
                  {c.arte!.modo === 'pronta' ? 'Arte pronta' : 'Foto + texto'} · efeito{' '}
                  {
                    { veu: 'véu neutro', degrade: 'degradê na cor da marca', nenhum: 'sem efeito' }[
                      c.arte!.efeito
                    ]
                  }{' '}
                  · imagem {c.arte!.imagem.largura} × {c.arte!.imagem.altura} px
                </li>
                <li>
                  Confira: texto legível sobre a foto, sem promessa enganosa (CDC e CONAR) e destino correto.
                </li>
              </ul>
              <div className="flex flex-wrap items-start gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    usePainel.getState().decidirArte(c.id, true);
                    registrar('Aprovou arte de anúncio', alvo);
                    avisar('Arte aprovada. O anúncio entra no ar no período contratado.');
                  }}
                >
                  Aprovar arte
                </button>
                <AcaoComMotivo
                  rotulo="Reprovar arte"
                  confirmar="Confirmar reprovação"
                  perigo
                  ajuda="o lojista vê este texto e pode reenviar"
                  onConfirmar={(m) => {
                    usePainel.getState().decidirArte(c.id, false, m);
                    registrar('Reprovou arte de anúncio', alvo, m);
                    avisar('Arte reprovada. O lojista pode reenviar.');
                  }}
                />
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
