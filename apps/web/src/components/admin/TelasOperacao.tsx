'use client';

import Link from 'next/link';
import { useState } from 'react';
import { StatusPedido } from '@/components/painel/Comum';
import { useTenant } from '@/components/providers/TenantProvider';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { COMISSAO_MAXIMA, repasse, TAXA_PAGAMENTO } from '@/lib/regras/admin';
import { reais } from '@/lib/regras/dinheiro';
import { FRETE_MINIMO } from '@/lib/regras/frete';
import { PEDIDOS_GLOBAIS } from '@/mocks/admin';
import { useAdmin } from '@/stores/admin';
import { usePainel } from '@/stores/painel';
import { AcaoComMotivo, AguardaAdmin, avisar, dataHora, Kpi, TituloAdmin, useDadosAdmin } from './Comum';

const registrar = (acao: string, alvo: string, motivo?: string) =>
  useAdmin.getState().registrar(acao, alvo, motivo);

/** Pedidos com o status ao vivo da loja da demo (o painel avança os dela). */
function usePedidos() {
  const doPainel = usePainel((s) => s.pedidos);
  return PEDIDOS_GLOBAIS.map((p) => {
    const vivo = doPainel.find((x) => x.id === p.id);
    return vivo ? { ...p, status: vivo.status } : p;
  });
}

const PAGAMENTO = {
  pendente: ['Aguardando', 'st-gray'],
  confirmado: ['Confirmado', 'st-green'],
  estornado: ['Estornado', 'st-red'],
} as const;

const FILTROS = [
  ['todos', 'Todos'],
  ['abertos', 'Em andamento'],
  ['analise', 'Em análise'],
  ['concluidos', 'Concluídos'],
] as const;
type Filtro = (typeof FILTROS)[number][0];

/* ---------------- Pedidos globais ---------------- */
export function PedidosAdmin({ filtro: inicial }: { filtro?: string }) {
  return (
    <AguardaAdmin>
      <PedidosConteudo inicial={FILTROS.some(([f]) => f === inicial) ? (inicial as Filtro) : 'todos'} />
    </AguardaAdmin>
  );
}

function PedidosConteudo({ inicial }: { inicial: Filtro }) {
  const { lojas } = useDadosAdmin();
  const analises = useAdmin((s) => s.analises);
  const [filtro, setFiltro] = useState<Filtro>(inicial);
  const pedidos = usePedidos();
  const concluido = (s: string) => ['entregue', 'retirado', 'cancelado'].includes(s);
  const lista = pedidos.filter((p) =>
    filtro === 'abertos'
      ? !concluido(p.status)
      : filtro === 'analise'
        ? p.id in analises
        : filtro === 'concluidos'
          ? concluido(p.status)
          : true,
  );

  return (
    <>
      <TituloAdmin
        titulo="Pedidos"
        apoio="Todas as lojas da cidade. Análise administrativa bloqueia o avanço do subpedido até ser liberada."
      />
      <div className="segmentado self-start" role="group" aria-label="Filtro">
        {FILTROS.map(([id, nome]) => (
          <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
            {nome}
          </button>
        ))}
      </div>
      {!lista.length ? (
        <CaixaVazia icone="receipt" titulo="Nenhum pedido" texto="Nenhum pedido neste filtro." />
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((p) => {
            const a = analises[p.id];
            const loja = lojas.find((l) => l.id === p.lojaId)?.nome ?? p.lojaId;
            return (
              <article key={p.id} className="card flex flex-col gap-2.5" aria-label={`Subpedido ${p.id}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <b>
                      {p.id} · {loja}
                    </b>
                    <span className="text-xs text-grafite-2">
                      {p.cliente} · {dataHora(p.quando)} ·{' '}
                      {p.modo === 'entrega' ? 'Entrega' : p.modo === 'retirada' ? 'Retirada' : 'Digital'} ·{' '}
                      {reais(p.produtosCentavos + p.freteCentavos)}
                    </span>
                  </span>
                  <span className={`status ${PAGAMENTO[p.pagamento][1]}`}>
                    Pagamento: {PAGAMENTO[p.pagamento][0]}
                  </span>
                  <StatusPedido s={p.status} />
                </div>
                {a && (
                  <div className="banner-info bg-aviso-claro text-aviso-texto">
                    <Icone nome="alert" />
                    <span className="text-[13px]">
                      <b>Em análise administrativa</b> desde {dataHora(a.desde)}: {a.motivo}. A loja não
                      consegue avançar este subpedido.
                    </span>
                  </div>
                )}
                {!concluido(p.status) && (
                  <div className="flex flex-wrap gap-2">
                    {a ? (
                      <AcaoComMotivo
                        rotulo="Liberar"
                        confirmar="Confirmar liberação"
                        onConfirmar={(m) => {
                          useAdmin.getState().liberarAnalise(p.id);
                          registrar('Liberou subpedido da análise', p.id, m);
                          avisar(`${p.id} liberado.`);
                        }}
                      />
                    ) : (
                      <AcaoComMotivo
                        rotulo="Colocar em análise"
                        confirmar="Confirmar análise"
                        perigo
                        ajuda="ex.: suspeita de fraude ou reclamação"
                        onConfirmar={(m) => {
                          useAdmin.getState().colocarEmAnalise(p.id, m);
                          registrar('Colocou subpedido em análise', p.id, m);
                          avisar(`${p.id} em análise. O avanço está bloqueado.`);
                        }}
                      />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <span className="text-[13px] text-grafite-2">
        Cancelamento, devolução, reembolso e chargeback dependem das políticas de pós-venda (PO-04).
      </span>
    </>
  );
}

/* ---------------- Financeiro ---------------- */
export function FinanceiroAdmin() {
  return (
    <AguardaAdmin>
      <FinanceiroConteudo />
    </AguardaAdmin>
  );
}

function FinanceiroConteudo() {
  const { lojas } = useDadosAdmin();
  const comissao = useAdmin((s) => s.comissaoPercentual);
  const pagos = usePedidos().filter((p) => p.pagamento === 'confirmado' && p.status !== 'cancelado');
  const porLoja = lojas
    .map((l) => {
      const ps = pagos.filter((p) => p.lojaId === l.id);
      const soma = ps.reduce(
        (a, p) => {
          const r = repasse(p, comissao);
          return {
            produtos: a.produtos + p.produtosCentavos,
            frete: a.frete + p.freteCentavos,
            comissao: a.comissao + r.comissao,
            taxa: a.taxa + r.taxa,
            liquido: a.liquido + r.liquido,
          };
        },
        { produtos: 0, frete: 0, comissao: 0, taxa: 0, liquido: 0 },
      );
      return { loja: l, pedidos: ps.length, ...soma };
    })
    .filter((x) => x.pedidos > 0);
  const total = porLoja.reduce(
    (a, x) => ({
      produtos: a.produtos + x.produtos,
      frete: a.frete + x.frete,
      comissao: a.comissao + x.comissao,
      taxa: a.taxa + x.taxa,
      liquido: a.liquido + x.liquido,
    }),
    { produtos: 0, frete: 0, comissao: 0, taxa: 0, liquido: 0 },
  );

  return (
    <>
      <TituloAdmin
        titulo="Financeiro"
        apoio={`Pedidos pagos · comissão ${comissao}% sobre produtos e taxa de pagamento ${TAXA_PAGAMENTO}% (ilustrativas, PO-03)`}
      />
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <Kpi rotulo="Produtos vendidos" valor={reais(total.produtos)} />
        <Kpi rotulo="Frete (da loja)" valor={reais(total.frete)} />
        <Kpi rotulo="Taxa do provedor" valor={reais(total.taxa)} />
        <Kpi rotulo="Comissão da plataforma" valor={reais(total.comissao)} destaque />
      </div>
      <div
        className="tabela-wrap"
        tabIndex={0}
        role="region"
        aria-label="Repasse por loja (role para os lados no celular)"
      >
        <table className="tabela">
          <thead>
            <tr>
              <th>Loja</th>
              <th>Pedidos</th>
              <th>Produtos</th>
              <th>Frete</th>
              <th>Comissão</th>
              <th>Taxa</th>
              <th>Repasse à loja</th>
            </tr>
          </thead>
          <tbody>
            {porLoja.map((x) => (
              <tr key={x.loja.id}>
                <td>
                  <b>{x.loja.nome}</b>
                </td>
                <td>{x.pedidos}</td>
                <td>{reais(x.produtos)}</td>
                <td>{reais(x.frete)}</td>
                <td>− {reais(x.comissao)}</td>
                <td>− {reais(x.taxa)}</td>
                <td>
                  <b>{reais(x.liquido)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[13px] text-grafite-2">
        O frete pertence à loja e não paga comissão. O repasse e o split são feitos pelo provedor de pagamento
        (PO-03); prazos de liberação dependem dele.
      </span>
    </>
  );
}

/* ---------------- Regras da cidade ---------------- */
export function RegrasAdmin() {
  return (
    <AguardaAdmin>
      <RegrasConteudo />
    </AguardaAdmin>
  );
}

function RegrasConteudo() {
  const tenant = useTenant();
  const comissao = useAdmin((s) => s.comissaoPercentual);
  const [valor, setValor] = useState(String(comissao));
  const n = Number(valor.replace(',', '.'));
  const valido = Number.isFinite(n) && n >= 0 && n <= COMISSAO_MAXIMA && n !== comissao;

  return (
    <>
      <TituloAdmin titulo="Regras da cidade" apoio={`${tenant.marca} · parceria ${tenant.associacao}`} />
      <section className="card flex flex-col gap-3" aria-label="Comissão">
        <h2>Comissão da plataforma</h2>
        <span className="text-[13px] text-grafite-2">
          Uniforme, só sobre produtos (o frete é da loja). O percentual real ainda será definido (PO-03); a
          mudança vale para pedidos novos e aparece no financeiro do lojista.
        </span>
        <div className="campo max-w-[220px]">
          <label htmlFor="rg-comissao">Comissão (%)</label>
          <input
            id="rg-comissao"
            className="input"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-invalid={valor !== '' && !(n >= 0 && n <= COMISSAO_MAXIMA) ? true : undefined}
            aria-describedby="rg-h"
          />
          <span id="rg-h" className="dica">
            Entre 0% e {COMISSAO_MAXIMA}%.
          </span>
        </div>
        {valido && (
          <AcaoComMotivo
            rotulo={`Aplicar ${n}%`}
            confirmar="Confirmar nova comissão"
            classe="btn btn-sm btn-primary self-start"
            onConfirmar={(m) => {
              useAdmin.getState().definirComissao(n);
              registrar(`Mudou a comissão de ${comissao}% para ${n}%`, tenant.marca, m);
              avisar(`Comissão agora é ${n}%.`);
            }}
          />
        )}
      </section>

      <section className="card flex flex-col gap-2" aria-label="Cobertura e entrega">
        <h2>Cobertura e entrega</h2>
        <span className="text-sm">
          Faixas de CEP atendidas: <b>{tenant.cepsAtendidos.map((c) => `${c}-xxx`).join(', ')}</b>
        </span>
        <span className="text-sm">
          Frete mínimo: <b>{reais(FRETE_MINIMO)}</b> · taxa do provedor: <b>{TAXA_PAGAMENTO}%</b>
        </span>
        <span className="text-[13px] text-grafite-2">
          Base de CEPs, calendário e fórmula de prazo ainda serão definidos (PO-05). Por enquanto, estes
          valores vêm da configuração da cidade e só mudam por implantação.
        </span>
      </section>

      <section className="card flex flex-col gap-2" aria-label="Ainda não disponível">
        <h2>Próximas versões</h2>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
          {[
            ['Cupons e frete grátis da plataforma', 'PO-08'],
            ['Notificações por e-mail e WhatsApp', 'PO-09'],
            ['Vitrines globais da home (curadoria)', 'a definir'],
            ['Logística: transportadoras e áreas por bairro', 'PO-05'],
          ].map(([t, po]) => (
            <li key={t} className="flex items-center gap-2">
              <span className="status st-gray">Pendente</span>
              {t} <span className="text-xs text-grafite-2">({po})</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ---------------- Auditoria ---------------- */
export function AuditoriaAdmin() {
  return (
    <AguardaAdmin>
      <AuditoriaConteudo />
    </AguardaAdmin>
  );
}

function AuditoriaConteudo() {
  const auditoria = useAdmin((s) => s.auditoria);
  const [busca, setBusca] = useState('');
  const q = busca.trim().toLowerCase();
  const lista = q
    ? auditoria.filter((a) => `${a.acao} ${a.alvo} ${a.motivo ?? ''}`.toLowerCase().includes(q))
    : auditoria;
  return (
    <>
      <TituloAdmin
        titulo="Auditoria"
        apoio="Quem fez o quê, quando e por quê. Registros não podem ser editados nem apagados."
      />
      <div className="campo max-w-sm">
        <label htmlFor="au-busca">Buscar na auditoria</label>
        <input
          id="au-busca"
          className="input"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <div
        className="tabela-wrap"
        tabIndex={0}
        role="region"
        aria-label="Registros (role para os lados no celular)"
      >
        <table className="tabela">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Quem</th>
              <th>Ação</th>
              <th>Alvo</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id}>
                <td>{dataHora(a.quando)}</td>
                <td>{a.quem}</td>
                <td>
                  <b>{a.acao}</b>
                </td>
                <td>{a.alvo}</td>
                <td className="!whitespace-normal">{a.motivo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!lista.length && <span className="text-sm text-grafite-2">Nenhum registro encontrado.</span>}
      <Link href="/admin" className="text-[13px]">
        Voltar à visão geral
      </Link>
    </>
  );
}
