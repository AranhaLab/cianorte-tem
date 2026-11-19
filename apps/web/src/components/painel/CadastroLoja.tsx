'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Icone } from '@/components/ui/Icone';
import { useTenant } from '@/components/providers/TenantProvider';
import { MODO_DEMO } from '@/lib/demo';
import {
  ETAPAS,
  erroDocumento,
  errosEtapa,
  etapaPendente,
  mascaraCelular,
  mascaraCep,
  mascaraCnpj,
  mascaraCpf,
  cadastroVazio,
  type ArquivoEnviado,
  type CadastroLoja,
} from '@/lib/regras/cadastroLoja';
import { tamanhoLegivel } from '@/lib/regras/posVenda';
import { usePainel } from '@/stores/painel';
import { AguardaPainel, TituloPainel, avisar } from './Comum';
import { LogoCadastro } from './LogoCadastro';
import { useLojaExibida, useLojaPainel } from './PainelContexto';

const STATUS: Record<string, [string, string]> = {
  rascunho: ['Cadastro incompleto', 'st-gray'],
  em_analise: ['Em análise', 'st-amber'],
  aprovada: ['Aprovada', 'st-green'],
  reprovada: ['Reprovada', 'st-red'],
  suspensa: ['Suspensa', 'st-red'],
};

/**
 * Cadastro da loja em etapas (CLAUDE.md §7.1). Cada alteração é salva na hora (na demo,
 * no aparelho; na versão real, rascunho em POST /v1/painel/cadastro) e o lojista retoma
 * de onde parou. Enviar leva à análise; aprovado, a loja pode ficar visível.
 */
export function CadastroLojista() {
  return (
    <AguardaPainel>
      <Conteudo />
    </AguardaPainel>
  );
}

function Conteudo() {
  const { loja } = useLojaPainel();
  const salvo = usePainel((s) => s.cadastro);
  const responsavel = usePainel((s) => s.responsavel);

  // Primeira vez: parte dos dados da loja de exemplo (já aprovada) para não começar em branco.
  useEffect(() => {
    if (salvo) return;
    const c = cadastroVazio();
    c.empresa = { cnpj: loja.cnpj, razao: `${loja.nome} Ltda`, fantasia: loja.nome, ie: '' };
    c.responsavel = { nome: responsavel.startsWith('[') ? '' : responsavel, cpf: '', email: '', celular: '' };
    c.unidade = { ...c.unidade, cep: '87200-000', bairro: loja.bairro };
    usePainel.getState().salvarCadastro(c);
  }, [salvo, loja, responsavel]);

  if (!salvo) return <div className="min-h-[40vh]" aria-busy="true" />;
  return <Assistente inicial={salvo} />;
}

function Assistente({ inicial }: { inicial: CadastroLoja }) {
  const tenant = useTenant();
  const lojaExibida = useLojaExibida();
  const status = usePainel((s) => s.status);
  const [c, setC] = useState(() =>
    inicial.unidade.cep ? inicial : { ...inicial, unidade: { ...inicial.unidade, cep: tenant.cepPadrao } },
  );
  const [etapa, setEtapa] = useState(Math.min(inicial.etapa, ETAPAS.length - 1));
  const [tentou, setTentou] = useState(false);
  const [conectando, setConectando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const travado = status === 'em_analise';

  // Salva a cada alteração (rascunho).
  const muda = (fn: (x: CadastroLoja) => CadastroLoja) =>
    setC((atual) => {
      const novo = fn(structuredClone(atual));
      usePainel.getState().salvarCadastro(novo);
      return novo;
    });
  const ir = (i: number) => {
    setEtapa(i);
    setTentou(false);
    muda((x) => ({ ...x, etapa: i }));
    requestAnimationFrame(() => titulo.current?.focus());
  };

  const erros = errosEtapa(etapa, c);
  const vis = tentou ? erros : {};
  const continuar = () => {
    setTentou(true);
    if (Object.keys(erros).length) return avisar('Confira os campos destacados.');
    ir(etapa + 1);
  };
  const enviar = () => {
    const pendente = etapaPendente(c);
    if (pendente >= 0) {
      avisar(`Falta completar: ${ETAPAS[pendente]}.`);
      return ir(pendente);
    }
    usePainel.getState().enviarCadastro();
    avisar(status === 'aprovada' ? 'Alterações salvas.' : 'Cadastro enviado! Análise em até 2 dias úteis.');
  };

  const conectar = () => {
    setConectando(true);
    // Demonstração: o provedor de pagamento confirma a conta (na real: redireciona para o provedor e volta).
    window.setTimeout(() => {
      muda((x) => ({ ...x, recebimento: { conectado: true, conta: 'Conta PJ ••• 4821 (demonstração)' } }));
      setConectando(false);
      avisar('Conta de recebimento conectada.');
    }, 900);
  };

  const anexar = (chave: keyof CadastroLoja['documentos']) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const erro = erroDocumento(f);
    if (erro) return avisar(erro);
    muda((x) => ({ ...x, documentos: { ...x.documentos, [chave]: { nome: f.name, tamanhoBytes: f.size } } }));
    avisar('Documento anexado.');
  };

  const campo = (
    id: string,
    rotulo: string,
    valor: string,
    mudar: (v: string) => void,
    extra: {
      erro?: string;
      dica?: string;
      tipo?: string;
      modo?: 'numeric' | 'tel' | 'email';
      auto?: string;
    } = {},
  ) => (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        className="input"
        value={valor}
        type={extra.tipo ?? 'text'}
        inputMode={extra.modo}
        autoComplete={extra.auto}
        disabled={travado}
        onChange={(e) => mudar(e.target.value)}
        aria-invalid={vis[extra.erro ?? ''] ? true : undefined}
        aria-describedby={vis[extra.erro ?? ''] ? `${id}-erro` : extra.dica ? `${id}-dica` : undefined}
      />
      {extra.dica && !vis[extra.erro ?? ''] && (
        <span id={`${id}-dica`} className="dica">
          {extra.dica}
        </span>
      )}
      {extra.erro && vis[extra.erro] && (
        <span id={`${id}-erro`} className="erro-campo">
          {vis[extra.erro]}
        </span>
      )}
    </div>
  );

  const pct = Math.round(((etapa + (status === 'rascunho' ? 0 : 1)) / ETAPAS.length) * 100);

  return (
    <>
      <TituloPainel
        titulo="Cadastro da loja"
        apoio="Seus dados ficam salvos a cada passo. A aprovação libera a loja para vender."
        acao={<span className={`status ${STATUS[status]![1]}`}>{STATUS[status]![0]}</span>}
      />

      <Situacao status={status} />

      <LogoCadastro loja={lojaExibida} />

      {/* Etapas */}
      <nav aria-label="Etapas do cadastro" className="card flex flex-col gap-3">
        <div className="h-2 overflow-hidden rounded-full bg-neutro-200" aria-hidden>
          <div
            className="h-full rounded-full bg-azul transition-[width] duration-300"
            style={{ width: `${Math.max(pct, 8)}%` }}
          />
        </div>
        <ol className="m-0 grid list-none grid-cols-3 gap-1.5 p-0 sm:grid-cols-6">
          {ETAPAS.map((nome, i) => {
            const ok = Object.keys(errosEtapa(i, c)).length === 0;
            const atual = i === etapa;
            return (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => ir(i)}
                  aria-current={atual ? 'step' : undefined}
                  className={`flex min-h-toque w-full items-center gap-1.5 rounded-[10px] border-0 px-2 text-left text-xs font-semibold ${
                    atual ? 'bg-marinho text-branco' : 'bg-neutro-100 text-grafite hover:bg-azul-nevoa'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] ${
                      ok
                        ? 'bg-verde text-branco'
                        : atual
                          ? 'bg-branco text-marinho'
                          : 'bg-neutro-300 text-grafite-2'
                    }`}
                  >
                    {ok ? <Icone nome="check" tamanho="sm" /> : i + 1}
                  </span>
                  {nome}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="card flex flex-col gap-4" aria-labelledby="titulo-etapa">
        <h2 id="titulo-etapa" ref={titulo} tabIndex={-1} className="outline-none">
          {etapa + 1}. {ETAPAS[etapa]}
        </h2>

        {etapa === 0 && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {campo(
              'cl-cnpj',
              'CNPJ',
              c.empresa.cnpj,
              (v) => muda((x) => ({ ...x, empresa: { ...x.empresa, cnpj: mascaraCnpj(v) } })),
              {
                erro: 'cnpj',
                modo: 'numeric',
              },
            )}
            {campo(
              'cl-razao',
              'Razão social',
              c.empresa.razao,
              (v) => muda((x) => ({ ...x, empresa: { ...x.empresa, razao: v } })),
              {
                erro: 'razao',
              },
            )}
            {campo(
              'cl-fantasia',
              'Nome fantasia (aparece na vitrine)',
              c.empresa.fantasia,
              (v) => muda((x) => ({ ...x, empresa: { ...x.empresa, fantasia: v } })),
              { erro: 'fantasia' },
            )}
            {campo('cl-ie', 'Inscrição estadual (opcional)', c.empresa.ie, (v) =>
              muda((x) => ({ ...x, empresa: { ...x.empresa, ie: v } })),
            )}
          </div>
        )}

        {etapa === 1 && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {campo(
              'cl-resp',
              'Nome completo',
              c.responsavel.nome,
              (v) => muda((x) => ({ ...x, responsavel: { ...x.responsavel, nome: v } })),
              {
                erro: 'nome',
                auto: 'name',
              },
            )}
            {campo(
              'cl-cpf',
              'CPF',
              c.responsavel.cpf,
              (v) => muda((x) => ({ ...x, responsavel: { ...x.responsavel, cpf: mascaraCpf(v) } })),
              {
                erro: 'cpf',
                modo: 'numeric',
              },
            )}
            {campo(
              'cl-email',
              'E-mail',
              c.responsavel.email,
              (v) => muda((x) => ({ ...x, responsavel: { ...x.responsavel, email: v } })),
              {
                erro: 'email',
                tipo: 'email',
                auto: 'email',
              },
            )}
            {campo(
              'cl-cel',
              'Celular (WhatsApp)',
              c.responsavel.celular,
              (v) => muda((x) => ({ ...x, responsavel: { ...x.responsavel, celular: mascaraCelular(v) } })),
              { erro: 'celular', modo: 'tel', auto: 'tel', dica: 'Avisos de novos pedidos.' },
            )}
          </div>
        )}

        {etapa === 2 && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {campo(
              'cl-cep',
              'CEP',
              c.unidade.cep,
              (v) => muda((x) => ({ ...x, unidade: { ...x.unidade, cep: mascaraCep(v) } })),
              {
                erro: 'cep',
                modo: 'numeric',
                dica: `Unidades de ${tenant.nome}.`,
              },
            )}
            {campo(
              'cl-bairro',
              'Bairro',
              c.unidade.bairro,
              (v) => muda((x) => ({ ...x, unidade: { ...x.unidade, bairro: v } })),
              {
                erro: 'bairro',
              },
            )}
            {campo(
              'cl-rua',
              'Rua',
              c.unidade.rua,
              (v) => muda((x) => ({ ...x, unidade: { ...x.unidade, rua: v } })),
              {
                erro: 'rua',
                auto: 'address-line1',
              },
            )}
            {campo(
              'cl-numero',
              'Número',
              c.unidade.numero,
              (v) => muda((x) => ({ ...x, unidade: { ...x.unidade, numero: v } })),
              {
                erro: 'numero',
              },
            )}
            {campo('cl-horario', 'Horário de funcionamento', c.unidade.horario, (v) =>
              muda((x) => ({ ...x, unidade: { ...x.unidade, horario: v } })),
            )}
          </div>
        )}

        {etapa === 3 && (
          <div className="flex flex-col gap-3">
            <div className="banner-info bg-azul-nevoa text-azul-escuro">
              <Icone nome="lock" />
              <span className="text-[13px]">
                Os dados bancários ficam direto no provedor de pagamento, que divide cada venda entre a loja e
                a plataforma (split). O {tenant.marca} não guarda conta nem senha do banco.
              </span>
            </div>
            {c.recebimento.conectado ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-verde-claro px-4 py-3 text-verde-texto">
                <Icone nome="check" />
                <span className="flex-1 text-sm">
                  <b>Conta conectada</b> · {c.recebimento.conta}
                </span>
                {!travado && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => muda((x) => ({ ...x, recebimento: { conectado: false, conta: '' } }))}
                  >
                    Trocar conta
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary self-start"
                onClick={conectar}
                disabled={conectando || travado}
              >
                {conectando ? 'Conectando ao provedor…' : 'Conectar conta de recebimento'}
              </button>
            )}
            {vis.recebimento && <span className="erro-campo">{vis.recebimento}</span>}
          </div>
        )}

        {etapa === 4 && (
          <div className="flex flex-col gap-3">
            {(
              [
                ['cartaoCnpj', 'Cartão CNPJ', 'Obrigatório'],
                ['contratoSocial', 'Contrato social', 'Para o selo Loja oficial'],
                ['registroMarca', 'Registro de marca (INPI)', 'Para o selo Loja oficial'],
              ] as const
            ).map(([chave, nome, apoio]) => (
              <Documento
                key={chave}
                nome={nome}
                apoio={apoio}
                arquivo={c.documentos[chave]}
                desabilitado={travado}
                onArquivo={anexar(chave)}
                onRemover={() =>
                  muda((x) => {
                    const d = { ...x.documentos };
                    delete d[chave];
                    return { ...x, documentos: d };
                  })
                }
                erro={chave === 'cartaoCnpj' ? vis.cartaoCnpj : undefined}
              />
            ))}
            <span className="dica">PDF, JPG ou PNG até 5 MB. Os documentos ficam em área privada.</span>
          </div>
        )}

        {etapa === 5 && (
          <div className="flex flex-col gap-3">
            <dl className="m-0 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Resumo titulo="Empresa" irPara={() => ir(0)}>
                {c.empresa.fantasia} · CNPJ {c.empresa.cnpj}
              </Resumo>
              <Resumo titulo="Responsável" irPara={() => ir(1)}>
                {c.responsavel.nome} · {c.responsavel.email}
              </Resumo>
              <Resumo titulo="Unidade" irPara={() => ir(2)}>
                {c.unidade.rua}, {c.unidade.numero} · {c.unidade.bairro} · {c.unidade.cep}
              </Resumo>
              <Resumo titulo="Recebimento" irPara={() => ir(3)}>
                {c.recebimento.conectado ? c.recebimento.conta : 'Não conectado'}
              </Resumo>
              <Resumo titulo="Documentos" irPara={() => ir(4)}>
                {Object.keys(c.documentos).length} anexado(s)
                {c.documentos.contratoSocial && c.documentos.registroMarca
                  ? ' · apto ao selo Loja oficial'
                  : ''}
              </Resumo>
            </dl>
            <label className="flex min-h-toque items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={c.aceite}
                disabled={travado}
                onChange={(e) => muda((x) => ({ ...x, aceite: e.target.checked }))}
                className="mt-px h-5 w-5 flex-none accent-azul"
                aria-invalid={vis.aceite ? true : undefined}
              />
              <span>
                Li e aceito o Contrato do Lojista e a{' '}
                <Link href="/privacidade" target="_blank">
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
            {vis.aceite && <span className="erro-campo">{vis.aceite}</span>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 border-t border-solid border-borda pt-4">
          {etapa > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => ir(etapa - 1)}>
              Voltar
            </button>
          )}
          <span className="flex-1 text-xs text-grafite-2">
            <Icone nome="check" tamanho="sm" /> Salvo automaticamente
          </span>
          {etapa < ETAPAS.length - 1 ? (
            <button type="button" className="btn btn-primary btn-lg" onClick={continuar}>
              Continuar
            </button>
          ) : (
            !travado && (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setTentou(true);
                  if (!c.aceite) return avisar('Aceite o Contrato do Lojista para enviar.');
                  enviar();
                }}
              >
                {status === 'aprovada' ? 'Salvar alterações' : 'Enviar para análise'}
              </button>
            )
          )}
        </div>
      </section>
    </>
  );
}

/** Situação do cadastro com o próximo passo (e, na demo, a aprovação simulada). */
function Situacao({ status }: { status: string }) {
  if (status === 'aprovada')
    return (
      <div className="banner-info bg-verde-claro text-verde-texto" role="status">
        <Icone nome="check" />
        <span className="flex flex-1 flex-wrap items-center gap-2 text-[13px]">
          <b>Loja aprovada.</b> Ligue &quot;Loja visível&quot; no menu para aparecer na vitrine.
          <Link href="/painel/produtos/novo" className="btn btn-sm btn-ghost ml-auto">
            Cadastrar produtos
          </Link>
        </span>
      </div>
    );
  if (status === 'em_analise')
    return (
      <div className="banner-info bg-aviso-claro text-aviso-texto" role="status">
        <Icone nome="clock" />
        <span className="flex flex-1 flex-wrap items-center gap-2 text-[13px]">
          <b>Cadastro em análise.</b> A equipe confere os dados e documentos em até 2 dias úteis; você recebe
          o resultado por e-mail e WhatsApp.
          {MODO_DEMO && (
            <button
              type="button"
              className="btn btn-sm btn-ghost ml-auto"
              onClick={() => {
                usePainel.getState().simularAprovacao();
                avisar('Loja aprovada (demonstração).');
              }}
            >
              Simular aprovação
            </button>
          )}
        </span>
      </div>
    );
  if (status === 'reprovada')
    return (
      <div className="banner-info bg-acento-claro text-acento-escuro" role="alert">
        <Icone nome="alert" />
        <span className="text-[13px]">Cadastro reprovado. Corrija os pontos indicados e envie de novo.</span>
      </div>
    );
  return null;
}

function Documento({
  nome,
  apoio,
  arquivo,
  desabilitado,
  onArquivo,
  onRemover,
  erro,
}: {
  nome: string;
  apoio: string;
  arquivo?: ArquivoEnviado;
  desabilitado: boolean;
  onArquivo: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemover: () => void;
  erro?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={`cartao-opcao items-center ${arquivo ? 'border-verde bg-verde-claro' : ''}`}>
      <span className="flex flex-1 flex-col">
        <b className="text-sm">{nome}</b>
        <span className="text-xs text-grafite-2">
          {arquivo ? `${arquivo.nome} · ${tamanhoLegivel(arquivo.tamanhoBytes)}` : apoio}
        </span>
        {erro && <span className="erro-campo">{erro}</span>}
      </span>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Anexar ${nome}`}
        onChange={onArquivo}
      />
      {arquivo ? (
        !desabilitado && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onRemover}>
            Remover
          </button>
        )
      ) : (
        <button
          type="button"
          className="btn btn-sm btn-soft"
          disabled={desabilitado}
          onClick={() => ref.current?.click()}
        >
          <Icone nome="upload" tamanho="sm" />
          Anexar
        </button>
      )}
    </div>
  );
}

function Resumo({ titulo, irPara, children }: { titulo: string; irPara: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-[12px] bg-neutro-100 px-3 py-2.5">
      <span className="flex min-w-0 flex-col">
        <dt className="text-xs font-semibold text-grafite-2">{titulo}</dt>
        <dd className="m-0 truncate text-[13px]">{children}</dd>
      </span>
      <button type="button" className="border-0 bg-transparent text-[13px] text-azul" onClick={irPara}>
        Editar
      </button>
    </div>
  );
}
