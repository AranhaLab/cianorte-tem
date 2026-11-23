'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { reais } from '@/lib/regras/dinheiro';
import { TAXA_PAGAMENTO as TAXA_PERCENTUAL } from '@/lib/regras/admin';
import { useAdmin } from '@/stores/admin';
import { usePainel } from '@/stores/painel';
import { AguardaPainel, StatusPedido, TituloPainel, avisar } from './Comum';
import { InterruptorVisivel } from './MenuPainel';
import { useLojaPainel } from './PainelContexto';
import { LogisticaLoja, UnidadesLoja } from './LogisticaLoja';
import { GestaoEstoque } from './GestaoEstoque';

export function Estoque() {
  return <AguardaPainel><GestaoEstoque /></AguardaPainel>;
}

/* ---------------- Financeiro (protótipo: vFinanceiro) ---------------- */
/** Percentuais ILUSTRATIVOS — comissão e taxa reais estão pendentes (PO-03). A comissão vem do admin. */
const TAXA_PAGAMENTO = TAXA_PERCENTUAL / 100;

export function Financeiro() {
  const COMISSAO = useAdmin((s) => s.comissaoPercentual) / 100;
  const pedidos = usePainel((s) => s.pedidos);
  const validos = pedidos.filter((o) => o.status !== 'cancelado');
  const bruto = validos.reduce((a, o) => a + o.totalCentavos, 0);
  const com = Math.round(bruto * COMISSAO);
  const taxa = Math.round(bruto * TAXA_PAGAMENTO);
  const liq = bruto - com - taxa;
  const liquidoDe = (v: number) => v - Math.round(v * COMISSAO) - Math.round(v * TAXA_PAGAMENTO);
  const disponivel = validos
    .filter((o) => o.status === 'entregue' || o.status === 'retirado')
    .reduce((a, o) => a + liquidoDe(o.totalCentavos), 0);
  const [periodo, setPeriodo] = useState<'atual' | 'anterior'>('atual');

  return (
    <AguardaPainel>
      <TituloPainel
        titulo="Financeiro"
        apoio={`Novembro · valores ilustrativos (comissão ${Math.round(COMISSAO * 1000) / 10}% sobre produtos e taxa de pagamento 2% — percentuais a definir)`}
        acao={
          <div className="segmentado" role="group" aria-label="Período">
            <button type="button" aria-pressed={periodo === 'atual'} onClick={() => setPeriodo('atual')}>
              Este mês
            </button>
            <button
              type="button"
              aria-pressed={periodo === 'anterior'}
              onClick={() => setPeriodo('anterior')}
            >
              Mês anterior
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        {[
          ['Vendas', reais(bruto)],
          ['Comissão da plataforma', `− ${reais(com)}`],
          ['Taxa de pagamento', `− ${reais(taxa)}`],
        ].map(([r, v]) => (
          <div key={r} className="kpi">
            <span className="text-[13px] text-grafite-2">{r}</span>
            <span className="kpi-valor">{v}</span>
          </div>
        ))}
        <div className="kpi border-marinho bg-marinho text-sobre-marinho">
          <span className="text-[13px]">Líquido para a loja</span>
          <span className="kpi-valor text-branco">{reais(liq)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="card flex flex-col gap-1">
          <span className="text-[13px] text-grafite-2">Disponível para saque</span>
          <span className="preco-grande text-[28px]">{reais(disponivel)}</span>
          <span className="text-xs text-grafite-2">
            Pedidos concluídos. Prazos reais de repasse dependem do provedor de pagamento.
          </span>
        </div>
        <div className="card flex flex-col gap-1">
          <span className="text-[13px] text-grafite-2">A liberar</span>
          <span className="preco-grande text-[28px]">{reais(Math.max(0, liq - disponivel))}</span>
          <span className="text-xs text-grafite-2">Pedidos pagos ainda não entregues ou retirados.</span>
        </div>
      </div>
      <div
        className="tabela-wrap"
        tabIndex={0}
        role="region"
        aria-label="Tabela (role para os lados no celular)"
      >
        <table className="tabela">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Quando</th>
              <th>Venda</th>
              <th>Comissão</th>
              <th>Taxa</th>
              <th>Líquido</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {validos.map((o) => (
              <tr key={o.id}>
                <td>
                  <b>{o.id}</b>
                </td>
                <td>{o.quando}</td>
                <td>{reais(o.totalCentavos)}</td>
                <td>− {reais(Math.round(o.totalCentavos * COMISSAO))}</td>
                <td>− {reais(Math.round(o.totalCentavos * TAXA_PAGAMENTO))}</td>
                <td>
                  <b>{reais(liquidoDe(o.totalCentavos))}</b>
                </td>
                <td>
                  <StatusPedido s={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[13px] text-grafite-2">
        O frete pertence à loja e não paga comissão. Estornos e devoluções aparecem aqui como lançamentos
        negativos.
      </span>
    </AguardaPainel>
  );
}

/* ---------------- Vitrine da loja (protótipo: vVitrineLoja; CLAUDE.md §16) ---------------- */
const MODULOS = [
  'Banner horizontal',
  'Mosaico',
  'Produtos em carrossel',
  'Produtos em grade',
  'Categorias da loja',
  'Vídeo vertical',
];

export function VitrineLoja() {
  const tenant = useTenant();
  const { loja } = useLojaPainel();
  const vitrine = usePainel((s) => s.vitrine);
  const { moverModulo, removerModulo, adicionarModulo } = usePainel.getState();
  const [novo, setNovo] = useState(MODULOS[0]!);
  const liberado = !!loja.selo; // só Oficiais e Indicadas

  return (
    <AguardaPainel>
      <TituloPainel
        titulo="Vitrine da loja"
        apoio="Monte a página da sua loja com módulos prontos. Sem código: nada de HTML, CSS ou JavaScript."
        acao={
          <Link href={`/loja/${loja.id}`} className="btn btn-ghost">
            <Icone nome="eye" tamanho="sm" />
            Ver loja
          </Link>
        }
      />
      {liberado ? (
        <div className="banner-info bg-verde-claro text-verde-texto">
          <Icone nome="shield" />
          <span>
            Disponível porque sua loja é <b>{loja.selo === 'oficial' ? 'Oficial' : 'Indicada'}</b>. Se perder
            o selo, a página volta ao modelo padrão (os módulos ficam guardados).
          </span>
        </div>
      ) : (
        <div className="banner-info bg-aviso-claro text-aviso-texto">
          <Icone nome="lock" />
          <span>A vitrine personalizada é exclusiva de lojas Oficiais e Indicadas.</span>
        </div>
      )}
      <div className="card flex flex-col">
        {vitrine.map((m, i) => (
          <div
            key={`${m.tipo}-${i}`}
            className={`flex items-center gap-2.5 py-3 ${i ? 'border-t border-solid border-neutro-200' : ''}`}
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-azul-nevoa font-titulo text-[13px] font-bold text-azul">
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="text-sm">{m.tipo}</b>
              <span className="text-xs text-grafite-2">{m.detalhe}</span>
            </span>
            <button
              type="button"
              className="icon-btn text-marinho hover:bg-neutro-200 disabled:opacity-40"
              aria-label={`Subir ${m.tipo}`}
              disabled={i === 0}
              onClick={() => moverModulo(i, -1)}
            >
              <Icone nome="chevD" className="rotate-180" />
            </button>
            <button
              type="button"
              className="icon-btn text-marinho hover:bg-neutro-200 disabled:opacity-40"
              aria-label={`Descer ${m.tipo}`}
              disabled={i === vitrine.length - 1}
              onClick={() => moverModulo(i, 1)}
            >
              <Icone nome="chevD" />
            </button>
            <button
              type="button"
              className="icon-btn text-acento-escuro hover:bg-acento-claro"
              aria-label={`Remover ${m.tipo}`}
              onClick={() => {
                removerModulo(i);
                avisar('Módulo removido.');
              }}
            >
              <Icone nome="trash" />
            </button>
          </div>
        ))}
      </div>
      <div className="card flex flex-wrap items-center gap-2.5">
        <label htmlFor="vadd-sel" className="sr-only">
          Tipo de módulo
        </label>
        <select
          id="vadd-sel"
          className="input max-w-[320px]"
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
        >
          {MODULOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!liberado}
          onClick={() => {
            adicionarModulo(novo);
            avisar('Módulo adicionado ao fim da vitrine.');
          }}
        >
          <Icone nome="plus" tamanho="sm" />
          Adicionar módulo
        </button>
      </div>
      <span className="text-[13px] text-grafite-2">
        Imagens e vídeos dos módulos passam por moderação. A home geral do {tenant.marca} é controlada pela
        plataforma; espaços nela são vendidos em Anúncios.
      </span>
    </AguardaPainel>
  );
}

/* ---------------- Minha loja (protótipo: vMinhaLoja; CLAUDE.md §7.2 e §7.4) ---------------- */
export function MinhaLoja() {
  const tenant = useTenant();
  const { loja } = useLojaPainel();
  const status = usePainel((s) => s.status);
  const visivel = usePainel((s) => s.visivel);
  return (
    <AguardaPainel>
      <TituloPainel
        titulo="Minha loja"
        acao={
          <Link href={`/loja/${loja.id}`} className="btn btn-ghost">
            <Icone nome="eye" tamanho="sm" />
            Ver vitrine
          </Link>
        }
      />
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <b>Loja visível no marketplace</b>
          <span className="text-[13px] text-grafite-2">
            {status !== 'aprovada'
              ? 'Disponível depois da aprovação do cadastro.'
              : visivel
                ? `Seus produtos aparecem para compradores de ${tenant.nome}.`
                : 'Sua loja está oculta. Pedidos em andamento continuam normalmente.'}
          </span>
        </span>
        <InterruptorVisivel desabilitarSeNaoAprovada />
      </div>
      <LogisticaLoja loja={loja} />
      <UnidadesLoja loja={loja} />
    </AguardaPainel>
  );
}

/* ---------------- Equipe (protótipo: vEquipe) ---------------- */
const AREAS = ['Pedidos', 'Produtos', 'Estoque', 'Financeiro', 'Anúncios', 'Equipe'] as const;

export function Equipe() {
  const equipe = usePainel((s) => s.equipe);
  return (
    <AguardaPainel>
      <TituloPainel
        titulo="Equipe"
        apoio="Cada pessoa entra com o próprio login e vê só o que você liberar."
        acao={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => avisar('Convite enviado por e-mail (demo).')}
          >
            <Icone nome="plus" tamanho="sm" />
            Convidar pessoa
          </button>
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
              <th>Pessoa</th>
              <th>Papel</th>
              {AREAS.map((a) => (
                <th key={a}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipe.map((m) => (
              <tr key={m.email}>
                <td>
                  <b>{m.nome}</b>
                  <br />
                  <span className="text-xs text-grafite-2">{m.email}</span>
                </td>
                <td>{m.papel}</td>
                {AREAS.map((a) => (
                  <td key={a}>
                    <input
                      type="checkbox"
                      aria-label={`${a} para ${m.nome}`}
                      defaultChecked={m.permissoes.includes(a)}
                      disabled={m.papel === 'Responsável'}
                      className="h-[18px] w-[18px] accent-azul"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[13px] text-grafite-2">
        Toda ação sensível (preço, estoque, repasse, equipe) fica registrada com autor e data.
      </span>
    </AguardaPainel>
  );
}
