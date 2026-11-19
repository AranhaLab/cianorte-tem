'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Icone } from '@/components/ui/Icone';
import {
  UNIDADES,
  diasEquivalentes,
  lanceMinimo,
  limitarQuantidade,
  valorTabela,
  type UnidadeTempo,
} from '@/lib/regras/anuncios';
import { paraCentavos, reais } from '@/lib/regras/dinheiro';
import { usePainel } from '@/stores/painel';
import type { StatusVaga, VagaId } from '@/types/domain';
import { AguardaPainel, TituloPainel, avisar } from './Comum';

const ROTULO_VAGA: Record<StatusVaga, string> = {
  disponivel: 'Livre',
  leilao: 'Em lance',
  ocupado: 'Ocupada',
};
const COR_VAGA: Record<StatusVaga, string> = {
  disponivel: 'border-verde bg-verde-claro text-verde-texto',
  leilao: 'border-aviso bg-aviso-claro text-aviso-texto',
  ocupado: 'border-neutro-500 bg-neutro-200 text-grafite-2',
};

/**
 * Central de anúncios (protótipo: vAnuncios; CLAUDE.md §9). O lojista escolhe uma
 * vaga no mapa do site, vê formato e valor, contrata pelo valor de tabela ou dá lance.
 * Valores e regras de lance são [PROPOSTA] até a tabela oficial ser aprovada.
 */
export function CentralAnuncios({ vagaInicial }: { vagaInicial?: VagaId }) {
  return (
    <AguardaPainel>
      <Conteudo vagaInicial={vagaInicial} />
    </AguardaPainel>
  );
}

function Conteudo({ vagaInicial }: { vagaInicial?: VagaId }) {
  const vagas = usePainel((s) => s.vagas);
  const sel = usePainel((s) => s.vagaSelecionada);
  const unidade = usePainel((s) => s.unidade);
  const quantidade = usePainel((s) => s.quantidade);
  const campanhas = usePainel((s) => s.campanhas);
  const { selecionarVaga, definirUnidade, definirQuantidade, contratar, darLance } = usePainel.getState();

  useEffect(() => {
    if (vagaInicial) selecionarVaga(vagaInicial);
  }, [vagaInicial, selecionarVaga]);

  const vaga = vagas.find((v) => v.id === sel)!;
  const u = UNIDADES[unidade];
  const qtd = limitarQuantidade(unidade, quantidade);
  const tabela = valorTabela(vaga, unidade, qtd);
  const minimo = lanceMinimo(vaga);
  const dias = diasEquivalentes(unidade, qtd);
  const [lance, setLance] = useState('');
  useEffect(() => setLance((minimo / 100).toFixed(2).replace('.', ',')), [minimo, sel]);

  const enviarLance = (e: FormEvent) => {
    e.preventDefault();
    const valor = paraCentavos(lance);
    if (darLance(valor) === 'abaixo_do_minimo') return avisar(`O lance mínimo é ${reais(minimo)} por dia.`);
    avisar(`Lance de ${reais(valor)}/dia registrado.`);
  };

  const Vaga = ({ id, altura, className = '' }: { id: VagaId; altura: number; className?: string }) => {
    const v = vagas.find((x) => x.id === id)!;
    const on = sel === id;
    return (
      <button
        type="button"
        onClick={() => selecionarVaga(id)}
        aria-pressed={on}
        aria-label={`${id} · ${ROTULO_VAGA[v.status]} — vaga ${v.nome}`}
        style={{ height: altura }}
        className={`flex w-full items-center justify-center gap-2 rounded-[10px] border-2 text-xs font-bold transition-transform hover:scale-[1.01] ${
          COR_VAGA[v.status]
        } ${on ? 'border-solid shadow-[0_0_0_4px] shadow-azul/25' : 'border-dashed'} ${className}`}
      >
        {id} · {ROTULO_VAGA[v.status]}
      </button>
    );
  };
  const Celula = ({ h = 54, className = '' }: { h?: number; className?: string }) => (
    <div className={`flex-1 rounded-[8px] bg-neutro-200 ${className}`} style={{ height: h }} />
  );
  const Rotulo = ({ children }: { children: ReactNode }) => (
    <span className="pt-1 text-[11px] font-bold uppercase tracking-[.08em] text-grafite-3">{children}</span>
  );

  return (
    <>
      <TituloPainel
        titulo="Anúncios"
        apoio="Escolha uma vaga no mapa do site, veja o formato e o valor, contrate ou dê um lance."
      />

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Mapa do site com as vagas (wireframe) */}
        <div
          aria-label="Mapa do site com as vagas de anúncio"
          className="flex flex-col gap-2 self-start rounded-xl border border-solid border-borda-fria bg-branco p-3.5"
        >
          <Rotulo>Home</Rotulo>
          <div className="h-[26px] rounded-[8px] bg-marinho" />
          <Vaga id="H1" altura={86} />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Celula key={i} h={28} className="rounded-full" />
            ))}
          </div>
          <Rotulo>Mais vendidos</Rotulo>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Celula key={i} />
            ))}
          </div>
          <Vaga id="M1" altura={40} />
          <Rotulo>Melhores preços</Rotulo>
          <div className="flex gap-1.5">
            <div className="flex-1">
              <Vaga id="C1" altura={54} />
            </div>
            {[1, 2, 3].map((i) => (
              <Celula key={i} />
            ))}
          </div>
          <Rotulo>Em alta</Rotulo>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Celula key={i} />
            ))}
          </div>
          <Vaga id="M2" altura={50} />
          <Rotulo>Lojas</Rotulo>
          <div className="flex gap-1.5">
            <Celula h={34} />
            <Celula h={34} />
          </div>
          <span className="mt-2.5">
            <Rotulo>Página de categoria</Rotulo>
          </span>
          <div className="h-[26px] rounded-[8px] bg-marinho" />
          <Vaga id="K1" altura={44} />
          <div className="flex gap-1.5">
            <div className="grid flex-[3] grid-cols-3 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[54px] rounded-[8px] bg-neutro-200" />
              ))}
            </div>
            <div className="flex-1">
              <Vaga id="L1" altura={114} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3.5 text-xs text-grafite-2">
            {(['disponivel', 'leilao', 'ocupado'] as StatusVaga[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <i className={`h-3 w-3 rounded-[4px] border-2 border-dashed ${COR_VAGA[s]}`} />
                {ROTULO_VAGA[s]}
              </span>
            ))}
          </div>
        </div>

        {/* Detalhe da vaga */}
        <div className="card flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-grafite-2">
                Vaga {vaga.id} · {vaga.pagina === 'home' ? 'Página inicial' : 'Páginas de categoria'}
              </span>
              <h2>{vaga.nome}</h2>
              <span className="text-[13px] text-grafite-2">{vaga.posicao}</span>
            </div>
            <span className="flex flex-col text-right">
              <span className="text-xs text-grafite-2">Tabela</span>
              <span className="preco-grande text-[26px]">
                {reais(vaga.precoDiaCentavos)}
                <span className="font-ui text-[13px] font-medium text-grafite-2">/dia</span>
              </span>
            </span>
          </div>

          {vaga.status === 'leilao' ? (
            <div className="banner-info bg-aviso-claro text-aviso-texto">
              <Icone nome="gavel" />
              <span>
                <b>Vaga em disputa.</b> Lance atual {reais(vaga.lanceAtualCentavos ?? 0)}/dia · {vaga.lances}{' '}
                lances · encerra em {vaga.terminaEm}. Quem der o maior lance por dia leva o período.
              </span>
            </div>
          ) : vaga.status === 'ocupado' ? (
            <div className="banner-info bg-azul-nevoa text-azul-escuro">
              <Icone nome="clock" />
              <span>
                <b>Ocupada até {vaga.ocupadoAte}.</b> Dê um lance para o próximo período. Quem ocupa hoje tem
                preferência na renovação pelo mesmo valor até 48 h antes do fim.
              </span>
            </div>
          ) : (
            <div className="banner-info bg-verde-claro text-verde-texto">
              <Icone nome="check" />
              <span>
                <b>Vaga livre.</b> Contrate pelo valor de tabela agora, ou dê um lance maior para garantir
                prioridade na rotação.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <b>Formato do anúncio</b>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Desktop', vaga.formato.desktop],
                ['Celular', vaga.formato.mobile],
                ['Proporção', vaga.formato.proporcao],
                ['Arquivo', 'JPG, PNG ou WebP · até 500 KB'],
                ['Área segura', 'Textos e logo a 40 px das bordas'],
                ['Rotação', `Até ${vaga.rotacao} anunciantes revezando`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[12px] bg-neutro-100 px-3 py-2.5 text-[13px]">
                  <b className="mb-0.5 block text-xs font-semibold text-grafite-2">{k}</b>
                  {v}
                </div>
              ))}
            </div>
            <span className="text-xs text-grafite-2">
              Todo anúncio leva a marca &quot;Patrocinado&quot; e o nome da loja. Peças passam por aprovação
              (sem conteúdo enganoso, conforme CDC e CONAR).
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <b>Por quanto tempo?</b>
            <div className="segmentado self-start" role="group" aria-label="Unidade de tempo">
              {(Object.keys(UNIDADES) as UnidadeTempo[]).map((k) => (
                <button key={k} type="button" aria-pressed={unidade === k} onClick={() => definirUnidade(k)}>
                  {UNIDADES[k].rotulo}
                </button>
              ))}
            </div>
            {unidade !== 'mes' && (
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  className="w-full flex-1 accent-azul"
                  min={u.min}
                  max={u.max}
                  value={qtd}
                  onChange={(e) => definirQuantidade(Number(e.target.value))}
                  aria-label={`Quantidade de ${u.rotulo.toLowerCase()}`}
                />
                <b className="min-w-[90px] text-right">
                  {qtd} {u.rotulo.toLowerCase()}
                </b>
              </div>
            )}
            <span className="text-xs text-grafite-2">
              Mínimo 6 horas · máximo 30 dias por contratação. Depois disso a vaga volta para a disputa ou é
              renovada.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-neutro-100 p-[18px]">
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] text-grafite-2">Valor de tabela para o período</span>
              <span className="preco-grande">{reais(tabela)}</span>
              <span className="text-xs text-grafite-2">
                ≈ {dias.toFixed(dias < 1 ? 2 : 0).replace('.', ',')} dia(s) · valores de exemplo
              </span>
            </span>
            {vaga.status === 'disponivel' && (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => {
                  contratar();
                  avisar(`Vaga ${vaga.id} reservada. Envie a arte para aprovação.`);
                }}
              >
                <Icone nome="check" />
                Contratar por {reais(tabela)}
              </button>
            )}
          </div>

          <form method="post" className="flex flex-col gap-2.5" onSubmit={enviarLance}>
            <b>{vaga.status === 'disponivel' ? 'Ou dê um lance por dia' : 'Seu lance por dia'}</b>
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="campo max-w-[240px] flex-1">
                <label htmlFor="lance">Valor por dia (R$)</label>
                <input
                  id="lance"
                  className="input"
                  inputMode="decimal"
                  value={lance}
                  onChange={(e) => setLance(e.target.value)}
                  aria-describedby="h-lance"
                />
                <span id="h-lance" className="dica">
                  Mínimo {reais(minimo)} · incremento de R$ 2,00
                </span>
              </div>
              <button type="submit" className="btn btn-dark btn-lg">
                <Icone nome="gavel" />
                Dar lance
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <b>Peça do anúncio</b>
            <div className="area-envio p-[22px]">
              <span className="text-azul">
                <Icone nome="upload" tamanho="lg" />
              </span>
              <b>Envie a arte no formato {vaga.formato.desktop}</b>
              <span className="text-[13px] text-grafite-2">
                Não tem arte? Use o modelo pronto com foto do produto, título e botão.
              </span>
            </div>
          </div>
        </div>
      </div>

      <h2>Minhas campanhas</h2>
      <div
        className="tabela-wrap"
        tabIndex={0}
        role="region"
        aria-label="Tabela (role para os lados no celular)"
      >
        <table className="tabela">
          <thead>
            <tr>
              <th>Vaga</th>
              <th>Período</th>
              <th>Valor/dia</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {campanhas.map((c, i) => (
              <tr key={`${c.vaga}-${i}`}>
                <td>
                  <b>{c.vaga}</b> · {vagas.find((v) => v.id === c.vaga)?.nome}
                </td>
                <td>{c.periodo}</td>
                <td>{reais(c.valorDiaCentavos)}</td>
                <td>
                  <span className={`status ${/vencendo|análise/i.test(c.status) ? 'st-amber' : 'st-green'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card flex flex-col gap-2">
        <h2>Regras da publicidade</h2>
        <span className="text-[13px] text-grafite-2">
          • Cada vaga reveza um número limitado de anunciantes (veja &quot;Rotação&quot;). • Contratação
          mínima de 6 horas e máxima de 30 dias; depois, renova ou libera. • Em disputa, ganha o maior lance
          por dia; empate fica com quem deu o lance primeiro. • O pagamento é cobrado só se o lance vencer. •
          Anúncio reprovado na moderação é reembolsado. • Valores desta tela são exemplos até a tabela oficial
          ser aprovada.
        </span>
      </div>
    </>
  );
}
