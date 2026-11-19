'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { CabecalhoPagina } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { useSacolaDetalhada, type GrupoLoja } from '@/hooks/useSacolaDetalhada';
import { api } from '@/lib/api';
import { cepValido, formatarCep, soDigitos } from '@/lib/regras/cadastro';
import { reais } from '@/lib/regras/dinheiro';
import { cepAtendido, podeRetirar } from '@/lib/regras/frete';
import { useComprador, type EtapaCheckout } from '@/stores/comprador';
import type { Endereco, ModoEntrega, Pedido } from '@/types/domain';

const ETAPAS: Array<[EtapaCheckout, string]> = [
  ['entrega', 'Entrega'],
  ['pagamento', 'Pagamento'],
  ['revisao', 'Revisão'],
];
const ENDERECO_VAZIO: Endereco = { cep: '', rua: '', numero: '', bairro: '', complemento: '' };

/**
 * Checkout em 3 etapas: Entrega → Pagamento → Revisão (CLAUDE.md §5.4 e §5.5).
 * Cada loja escolhe entrega ou retirada. O servidor revalida preço, estoque e
 * cobertura ao confirmar; aqui é só a experiência.
 */
export function Checkout() {
  const tenant = useTenant();
  const router = useRouter();
  const usuario = useComprador((s) => s.usuario)!;
  const itens = useComprador((s) => s.itens);
  const cepAtual = useComprador((s) => s.cep ?? tenant.cepPadrao);
  const rascunho = useComprador((s) => s.checkout);
  const { atualizarCheckout, salvarEndereco, registrarPedido, avisar } = useComprador.getState();
  const { grupos, subtotal, carregando } = useSacolaDetalhada();

  const [end, setEnd] = useState<Endereco>(usuario.endereco ?? { ...ENDERECO_VAZIO, cep: cepAtual });
  const [cpfNota, setCpfNota] = useState(usuario.cpf);
  const [enviando, setEnviando] = useState(false);
  // Uma chave por tentativa: clicar duas vezes em "Confirmar" não cria dois pedidos (Idempotency-Key).
  const [chaveIdempotencia] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!itens.length && !enviando) router.replace('/sacola');
  }, [itens.length, enviando, router]);

  const naCidade = cepAtendido(tenant, end.cep || cepAtual);
  const opcoes = (g: GrupoLoja) => ({
    entrega: g.loja.entrega && naCidade,
    retirada: podeRetirar(g.loja, naCidade),
  });
  const modoDe = (g: GrupoLoja): ModoEntrega | null => {
    const o = opcoes(g);
    const escolhido = rascunho.modos[g.loja.id];
    if (escolhido && o[escolhido]) return escolhido;
    return o.entrega ? 'entrega' : o.retirada ? 'retirada' : null;
  };

  const totais = useMemo(() => {
    const frete = grupos.reduce((a, g) => a + (modoDe(g) === 'entrega' ? g.frete : 0), 0);
    return { frete, total: subtotal + frete };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupos, subtotal, rascunho.modos, end.cep]);

  if (carregando || !grupos.length) return <div className="min-h-[50vh]" aria-busy="true" />;

  const etapa = rascunho.etapa;
  const irPara = (e: EtapaCheckout) => {
    atualizarCheckout({ etapa: e });
    window.scrollTo(0, 0);
  };

  const validarEntrega = () => {
    if (grupos.some((g) => modoDe(g) === null)) return avisar('Uma das lojas não atende este endereço.');
    const precisaEndereco = grupos.some((g) => modoDe(g) === 'entrega');
    if (
      precisaEndereco &&
      (!cepValido(end.cep) || !end.rua.trim() || !end.numero.trim() || !end.bairro.trim())
    )
      return avisar('Preencha CEP, rua, número e bairro para a entrega.');
    salvarEndereco({ ...end, cep: formatarCep(end.cep) });
    irPara('pagamento');
  };

  const confirmar = async () => {
    setEnviando(true);
    const numero = String(10500 + useComprador.getState().pedidos.length + 1);
    const pedido: Pedido = {
      id: numero,
      criadoEm: new Date().toISOString(),
      totalCentavos: totais.total,
      pagamento: rascunho.pagamento,
      pago: false,
      subpedidos: grupos.map((g, i) => ({
        id: `${numero}-${'ABCDEFGH'[i]}`,
        lojaId: g.loja.id,
        modo: modoDe(g) ?? 'entrega',
        status: 'realizado',
      })),
    };
    const criado = await api.checkout.criarPedido(tenant.slug, pedido, chaveIdempotencia);
    registrarPedido(criado);
    router.push(`/pedido/${criado.id}`);
  };

  const campo = (k: keyof Endereco, rotulo: string, extra: Record<string, string> = {}) => (
    <div className="campo">
      <label htmlFor={`e-${k}`}>{rotulo}</label>
      <input
        id={`e-${k}`}
        className="input"
        value={end[k]}
        onChange={(e) => setEnd({ ...end, [k]: k === 'cep' ? e.target.value.slice(0, 9) : e.target.value })}
        {...extra}
      />
    </div>
  );

  const idx = ETAPAS.findIndex(([e]) => e === etapa);

  return (
    <>
      <CabecalhoPagina
        titulo="Finalizar compra"
        acao={
          <Link href="/sacola" className="text-[13px]">
            Voltar à sacola
          </Link>
        }
      />
      <ol aria-label="Etapas da compra" className="mb-1 mt-4 flex list-none gap-1.5 p-0">
        {ETAPAS.map(([e, rotulo], i) => (
          <li
            key={e}
            aria-current={i === idx ? 'step' : undefined}
            className={`flex flex-1 flex-col gap-1.5 text-xs font-semibold before:h-1 before:rounded-[4px] before:content-[''] ${
              i < idx
                ? 'text-marinho before:bg-verde'
                : i === idx
                  ? 'text-marinho before:bg-azul'
                  : 'text-grafite-2 before:bg-neutro-400'
            }`}
          >
            {i + 1}. {rotulo}
          </li>
        ))}
      </ol>

      <div className="mt-4 grid grid-cols-1 items-start gap-5 min-[960px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3.5">
          {etapa === 'entrega' && (
            <>
              <div className="card flex flex-col gap-3">
                <h2>Endereço de entrega</h2>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {campo('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code' })}
                  {campo('bairro', 'Bairro', { autoComplete: 'address-level3' })}
                  {campo('rua', 'Rua', { autoComplete: 'address-line1' })}
                  <div className="grid grid-cols-2 gap-3.5">
                    {campo('numero', 'Número')}
                    {campo('complemento', 'Complemento', { autoComplete: 'address-line2' })}
                  </div>
                </div>
                <span className="dica">
                  Cidade: {tenant.nome}/{tenant.uf}. Ao trocar o CEP, revalidamos se cada loja entrega ou
                  permite retirada.
                </span>
                {soDigitos(end.cep).length === 8 && !naCidade && (
                  <div className="banner-info bg-acento-claro text-acento-escuro" role="alert">
                    <Icone nome="alert" />
                    <span>Este CEP está fora da área atendida pelas lojas de {tenant.nome}.</span>
                  </div>
                )}
              </div>

              {grupos.map((g) => {
                const o = opcoes(g);
                const modo = modoDe(g);
                return (
                  <fieldset key={g.loja.id} className="card m-0 flex flex-col gap-3">
                    <legend className="sr-only">Entrega de {g.loja.nome}</legend>
                    <div className="flex items-center gap-2.5">
                      <AvatarLoja loja={g.loja} className="h-9 w-9 rounded-[10px] text-[13px]" />
                      <b className="flex-1">{g.loja.nome}</b>
                      <span className="text-xs text-grafite-2">{g.linhas.length} item(ns)</span>
                    </div>
                    <label className="cartao-opcao">
                      <input
                        type="radio"
                        name={`m-${g.loja.id}`}
                        checked={modo === 'entrega'}
                        disabled={!o.entrega}
                        onChange={() =>
                          atualizarCheckout({ modos: { ...rascunho.modos, [g.loja.id]: 'entrega' } })
                        }
                      />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <b>Entrega · {g.loja.prazo}</b>
                        <span className="text-[13px] text-grafite-2">
                          Frete {g.frete ? reais(g.frete) : <b className="text-verde-texto">grátis</b>} ·
                          previsão após confirmação do pagamento
                        </span>
                      </span>
                    </label>
                    <label className="cartao-opcao">
                      <input
                        type="radio"
                        name={`m-${g.loja.id}`}
                        checked={modo === 'retirada'}
                        disabled={!o.retirada}
                        onChange={() =>
                          atualizarCheckout({ modos: { ...rascunho.modos, [g.loja.id]: 'retirada' } })
                        }
                      />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <b>Retirar na loja · grátis</b>
                        <span className="text-[13px] text-grafite-2">
                          {o.retirada
                            ? `${g.loja.bairro}, ${tenant.nome} · avisamos quando estiver pronto`
                            : 'Indisponível para este endereço ou loja'}
                        </span>
                      </span>
                    </label>
                  </fieldset>
                );
              })}
              <button type="button" className="btn btn-primary btn-lg" onClick={validarEntrega}>
                Ir para o pagamento
              </button>
            </>
          )}

          {etapa === 'pagamento' && (
            <>
              <fieldset className="card m-0 flex flex-col gap-3">
                <legend className="contents">
                  <h2>Como você quer pagar?</h2>
                </legend>
                <label className="cartao-opcao">
                  <input
                    type="radio"
                    name="pg"
                    checked={rascunho.pagamento === 'pix'}
                    onChange={() => atualizarCheckout({ pagamento: 'pix' })}
                  />
                  <span className="flex flex-1 items-center gap-2.5">
                    <IconePix />
                    <span className="flex flex-col gap-0.5">
                      <b>Pix</b>
                      <span className="text-[13px] text-grafite-2">
                        Aprovação na hora. O código vale por 30 minutos.
                      </span>
                    </span>
                  </span>
                </label>
                <label className="cartao-opcao">
                  <input
                    type="radio"
                    name="pg"
                    checked={rascunho.pagamento === 'cartao'}
                    onChange={() => atualizarCheckout({ pagamento: 'cartao' })}
                  />
                  <span className="flex flex-1 items-center gap-2.5">
                    <Icone nome="card" tamanho="lg" />
                    <span className="flex flex-col gap-0.5">
                      <b>Cartão de crédito</b>
                      <span className="text-[13px] text-grafite-2">
                        Parcelamento conforme o provedor de pagamento.
                      </span>
                    </span>
                  </span>
                </label>
                {rascunho.pagamento === 'cartao' && <CamposCartao total={totais.total} />}
              </fieldset>
              <div className="card flex flex-col gap-3">
                <h2>Nota fiscal</h2>
                <div className="campo">
                  <label htmlFor="nf-cpf">CPF para a nota</label>
                  <input
                    id="nf-cpf"
                    className="input"
                    inputMode="numeric"
                    value={cpfNota}
                    onChange={(e) => setCpfNota(e.target.value)}
                  />
                </div>
                <span className="dica">Cada loja emite a nota da sua parte da compra.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button type="button" className="btn btn-ghost" onClick={() => irPara('entrega')}>
                  <Icone nome="chevL" tamanho="sm" />
                  Voltar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg flex-1"
                  onClick={() => irPara('revisao')}
                >
                  Revisar pedido
                </button>
              </div>
            </>
          )}

          {etapa === 'revisao' && (
            <>
              <div className="card flex flex-col gap-0">
                <h2>Revise antes de pagar</h2>
                {grupos.map((g) => {
                  const modo = modoDe(g);
                  return (
                    <div
                      key={g.loja.id}
                      className="mt-3 flex flex-col gap-1.5 border-t border-solid border-borda pt-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <b>{g.loja.nome}</b>
                        <span className={`pill ${modo === 'entrega' ? 'pill-indicada' : 'pill-local'}`}>
                          {modo === 'entrega' ? `Entrega · ${g.loja.prazo}` : 'Retirada na loja'}
                        </span>
                      </div>
                      {g.linhas.map((l) => (
                        <div key={l.item.chave} className="linha-resumo">
                          <span>
                            {l.item.quantidade}× {l.produto.nome}
                            {l.item.opcao ? ` (${l.item.opcao})` : ''}
                          </span>
                          <span>{reais(l.produto.precoCentavos * l.item.quantidade)}</span>
                        </div>
                      ))}
                      {modo === 'entrega' && (
                        <div className="linha-resumo">
                          <span>Frete da loja</span>
                          <span>{g.frete ? reais(g.frete) : 'Grátis'}</span>
                        </div>
                      )}
                      <span className="text-xs text-grafite-2">
                        Vendido e entregue por {g.loja.nome} · CNPJ {g.loja.cnpj}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="card flex flex-col gap-2">
                <h2>Pagamento</h2>
                <span>
                  {rascunho.pagamento === 'pix'
                    ? 'Pix — o código aparece na próxima tela'
                    : 'Cartão de crédito'}
                </span>
              </div>
              {/* Resumo do contrato antes de pagar (CDC; Decreto 7.962/2013) */}
              <div className="legal-box flex flex-col gap-1.5">
                <b className="text-marinho">Resumo das condições</b>
                <span>
                  • Você pode desistir em até 7 dias após o recebimento, com reembolso integral (art. 49 do
                  CDC).
                </span>
                <span>• O prazo de entrega começa a contar após a confirmação do pagamento.</span>
                <span>• Trocas por defeito seguem a garantia legal de 90 dias.</span>
                <span>
                  • Seus dados são tratados conforme a{' '}
                  <Link href="/privacidade">Política de Privacidade</Link> (LGPD).
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button type="button" className="btn btn-ghost" onClick={() => irPara('pagamento')}>
                  <Icone nome="chevL" tamanho="sm" />
                  Voltar
                </button>
                <button
                  type="button"
                  className="btn btn-green btn-lg flex-1"
                  disabled={enviando}
                  onClick={confirmar}
                >
                  <Icone nome="lock" tamanho="sm" />
                  Confirmar e pagar {reais(totais.total)}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="card flex flex-col gap-2.5 min-[960px]:sticky min-[960px]:top-[140px]">
          <h2>Resumo</h2>
          <div className="linha-resumo">
            <span>Produtos</span>
            <span>{reais(subtotal)}</span>
          </div>
          <div className="linha-resumo">
            <span>Fretes</span>
            <span>{totais.frete ? reais(totais.frete) : 'Grátis'}</span>
          </div>
          <div className="total-resumo">
            <span>Total</span>
            <span>{reais(totais.total)}</span>
          </div>
          <span className="text-xs text-grafite-2">
            Valores, estoque e cobertura são conferidos de novo pelo servidor ao confirmar.
          </span>
        </aside>
      </div>
    </>
  );
}

/**
 * Campos do cartão. Na versão real estes campos são do SDK do provedor (iframe/
 * tokenização): o número e o CVV nunca passam pelo nosso servidor (CLAUDE.md §5.5).
 * Aqui não são guardados em lugar nenhum.
 */
function CamposCartao({ total }: { total: number }) {
  const tenant = useTenant();
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="campo">
        <label htmlFor="c-num">Número do cartão</label>
        <input
          id="c-num"
          className="input"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
        />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="campo">
          <label htmlFor="c-nome">Nome impresso</label>
          <input id="c-nome" className="input" autoComplete="cc-name" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="campo">
            <label htmlFor="c-val">Validade</label>
            <input id="c-val" className="input" autoComplete="cc-exp" placeholder="MM/AA" />
          </div>
          <div className="campo">
            <label htmlFor="c-cvv">CVV</label>
            <input id="c-cvv" className="input" autoComplete="cc-csc" inputMode="numeric" />
          </div>
        </div>
      </div>
      <div className="campo">
        <label htmlFor="c-parc">Parcelas</label>
        <select id="c-parc" className="input">
          {[1, 2, 3].map((n) => (
            <option key={n}>
              {n}x de {reais(Math.round(total / n))}
            </option>
          ))}
        </select>
      </div>
      <div className="banner-info bg-azul-nevoa text-azul-escuro">
        <Icone nome="lock" />
        <span className="text-[13px]">
          Os dados do cartão vão direto para o provedor de pagamento (tokenização). O {tenant.marca} não
          armazena número nem CVV.
        </span>
      </div>
    </div>
  );
}

/** Losango do Pix (o lucide não tem o ícone oficial; o mesmo traço do protótipo). */
export function IconePix() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M12 3 21 12 12 21 3 12zM8.5 12h7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
